const router = require('express').Router();
const axios = require('axios');
const AdmZip = require('adm-zip');
const db = require('../db');
const { PARSERS } = require('../parsers');
const { v4: uuidv4 } = require('uuid');
const { alignRoutes, decrypt } = require('../utils');

// --- HELPER: GET SNIPPET ---
function getSmartSnippet(content, lineIndex) {
    const lines = content.split('\n');
    const start = Math.max(0, lineIndex - 2);
    const end = Math.min(lines.length, lineIndex + 6);
    return lines.slice(start, end).join('\n');
}

// --- SCANNING LOGIC ---
async function executeUserScanLogic(owner, repo, branch, token) {
    console.log(`🚀 Scanning ${owner}/${repo} [${branch}]...`);

    const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`;
    const response = await axios.get(zipUrl, {
        responseType: 'arraybuffer',
        headers: { Authorization: `token ${token}` }
    });

    const zip = new AdmZip(response.data);
    const zipEntries = zip.getEntries();
    const foundRoutes = [];


    zipEntries.forEach((entry) => {
        if (entry.isDirectory) return;
        if (!entry.entryName.match(/\.(js|ts|jsx|tsx|py|mjs)$/)) return;
        if (entry.header.size > 100000) return;

        const cleanPath = entry.entryName.substring(entry.entryName.indexOf("/") + 1);
        const content = entry.getData().toString('utf8');

        // --- HARDCODED IGNORE LIST (MVP) ---
        // If you need to change this later, you just edit this array. No DB migration needed.
        if (
            cleanPath.includes('node_modules') ||
            cleanPath.includes('.test.') ||
            cleanPath.includes('.spec.') ||
            cleanPath.startsWith('dist/') ||
            cleanPath.startsWith('build/')
        ) {
            return;
        }

        // --- DETECT PARSER TYPE ---
        let parserType = null;

        if (cleanPath.endsWith('.py')) {
            if (content.includes('@app.route')) parserType = 'flask';
            else if (content.includes('fastapi') || content.includes('APIRouter')) parserType = 'fastapi';
        }
        else if (cleanPath.match(/app\/.*\/route\.(ts|js)$/)) {
            parserType = 'nextjs';
        }
        else if (cleanPath.match(/\.(js|ts|jsx|tsx)$/)) {
            // Priority 1: Explicit Frontend indicators
            if (content.includes("'use client'") || content.includes('"use client"') || content.includes('from \'react\'') || content.includes('from "react"')) {
                parserType = 'frontend';
            }
            // Priority 2: Explicit Backend
            else if (content.includes('express') || (content.includes('Router') && !content.includes('useRouter'))) {
                parserType = 'express';
            }
            // Fallback
            else {
                parserType = cleanPath.match(/\.(jsx|tsx)$/) ? 'frontend' : 'express';
            }
        }

        if (!parserType) return;

        // --- RUN MAIN PARSER ---
        const parser = PARSERS[parserType];
        if (!parser || !parser.pattern) return;

        const matches = [...content.matchAll(parser.pattern)];

        matches.forEach(m => {
            const route = parser.extract(m);
            const linesBefore = content.substring(0, m.index).split('\n');
            const lineNumber = linesBefore.length;
            const snippet = getSmartSnippet(content, lineNumber - 1);

            let finalPath = route.path;
            if (parserType === 'nextjs') {
                finalPath = cleanPath
                    .replace(/^src\/app/, '')
                    .replace(/^app/, '')
                    .replace(/\/route\.(ts|js)$/, '')
                    .replace(/\\/g, '/');
                if (!finalPath.startsWith('/')) finalPath = '/' + finalPath;
            }

            foundRoutes.push({
                file: cleanPath,
                lineNumber,
                type: (parserType === 'frontend' || parserType === 'fetch') ? 'consumption' : 'definition',
                method: route.method,
                path: finalPath,
                originalLine: route.original,
                codeSnippet: snippet
            });
        });

        // --- EXTRA: RUN FETCH PARSER ON FRONTEND FILES ---
        if (parserType === 'frontend') {
            const fetchMatches = [...content.matchAll(PARSERS.fetch.pattern)];

            fetchMatches.forEach(m => {
                const route = PARSERS.fetch.extract(m);
                const linesBefore = content.substring(0, m.index).split('\n');
                const fetchLineNumber = linesBefore.length;
                const snippet = getSmartSnippet(content, fetchLineNumber - 1);

                // === NEW METHOD DETECTION LOGIC ===
                // 1. Determine where the 'fetch' call ended
                const endIndex = m.index + m[0].length;

                // 2. Look ahead 800 characters to find the options object { method: 'POST' }
                let contextWindow = content.substring(endIndex, endIndex + 800);

                // 3. Clean comments so we don't accidentally match commented-out code
                contextWindow = contextWindow.replace(/\/\/.*$/gm, ''); // Remove single-line comments
                contextWindow = contextWindow.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

                // 4. Regex to find "method: 'POST'" (case insensitive)
                const methodMatch = contextWindow.match(/method\s*:\s*['"]\s*(GET|POST|PUT|DELETE|PATCH)\s*['"]/i);

                if (methodMatch) {
                    // Override the default GET with the found method
                    route.method = methodMatch[1].toUpperCase();
                }

                foundRoutes.push({
                    file: cleanPath,
                    lineNumber: fetchLineNumber,
                    type: 'consumption',
                    method: route.method,
                    path: route.path,
                    originalLine: route.original,
                    codeSnippet: snippet
                });
            });
        }
    });


    return foundRoutes;
}

// --- ROUTE 1: START ---
router.post('/start', async (req, res) => {
    const { name, environment, frontendOwner, backendOwner, backendRepo, frontendRepo, backendBranch, frontendBranch, frontendCredentialId, backendCredentialId } = req.body;
    const userId = req.user.id;

    try {
        const uuid = uuidv4();

        if (frontendOwner && backendOwner && backendRepo && frontendRepo && backendBranch && frontendBranch && frontendCredentialId && backendCredentialId) {
            const [result] = await db.execute(
                `INSERT INTO Projects (user_id, name, environment, backend_owner, backend_repo, backend_branch, frontend_owner, frontend_repo, frontend_branch, frontend_credential_id, last_scanned_at, health_score, uuid, backend_credential_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0.00, ?, ?)`,
                [userId, name, environment, backendOwner, backendRepo, backendBranch, frontendOwner, frontendRepo, frontendBranch, frontendCredentialId, uuid, backendCredentialId]
            );

            if (result.affectedRows < 1) {
                return res.status(500).json({ success: false, error: "Database Error." });
            }

            return res.status(200).json({ success: true, uuid: uuid });
        }
        else {
            return res.status(500).json({ success: false, error: "Please fill in all fields!" });
        }
    } catch (error) {
        console.error("Start Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- ROUTE 2: DETAILS (Updated with Caching) ---
router.post('/details', async (req, res) => {
    const { uuid, force, scanId } = req.body; // Added 'force' flag

    if (!uuid) return res.status(400).json({ success: false, error: "No UUID provided" });

    try {
        // 1. Fetch Project ID first
        const [projects] = await db.execute('SELECT * FROM Projects WHERE uuid = ?', [uuid]);
        if (projects.length === 0) return res.status(404).json({ success: false, error: "Project not found" });
        const project = projects[0];

        // 2. CACHE CHECK: If not forcing, try to get latest scan from DB
        if (!force) {
            let query = '';
            let params = [];

            if (scanId) {
                // CASE A: User clicked a specific item in History
                console.log(`📜 Loading historical scan #${scanId}`);
                query = 'SELECT results, completed_at FROM Scans WHERE id = ? AND project_id = ?';
                params = [scanId, project.id];
            } else {
                // CASE B: Default load (Latest scan)
                query = 'SELECT results, completed_at FROM Scans WHERE project_id = ? AND status = "completed" ORDER BY completed_at DESC LIMIT 1';
                params = [project.id];
            }

            const [cachedScans] = await db.execute(query, params);

            if (cachedScans.length > 0 && cachedScans[0].results) {
                console.log(`⚡ Serving cached results for ${project.name}`);

                // Determine if 'results' is already an object or needs parsing (depends on MySQL driver)
                let scanData = cachedScans[0].results;
                if (typeof scanData === 'string') {
                    scanData = JSON.parse(scanData);
                }

                // Inject the project info into the response so the UI works
                return res.json({
                    success: true,
                    data: {
                        project: {
                            name: project.name,
                            environment: project.environment,
                            lastScanned: cachedScans[0].completed_at
                        },
                        ...scanData
                    }
                });
            }
        }

        // 3. IF NO CACHE OR FORCE REFRESH -> RUN SCAN LOGIC

        // Fetch Tokens
        const [frontCreds] = await db.execute('SELECT access_token FROM GitCredentials WHERE id = ?', [project.frontend_credential_id]);
        const [backCreds] = await db.execute('SELECT access_token FROM GitCredentials WHERE id = ?', [project.backend_credential_id]);

        if (!frontCreds.length || !backCreds.length) return res.status(404).json({ success: false, error: "Credentials missing" });

        const frontToken = decrypt(frontCreds[0].access_token);
        const backToken = decrypt(backCreds[0].access_token);

        let allRoutes = [];

        // Check: Are repos identical?
        const isSameRepo =
            project.frontend_owner === project.backend_owner &&
            project.frontend_repo === project.backend_repo &&
            project.frontend_branch === project.backend_branch;

        if (isSameRepo) {
            console.log(`ℹ️ Same repository detected (${project.frontend_repo}). Running Single Scan.`);
            allRoutes = await executeUserScanLogic(project.frontend_owner, project.frontend_repo, project.frontend_branch, frontToken);
        } else {
            console.log(`ℹ️ Different repositories detected. Running Parallel Scan.`);
            const [frontendRoutes, backendRoutes] = await Promise.all([
                executeUserScanLogic(project.frontend_owner, project.frontend_repo, project.frontend_branch, frontToken),
                executeUserScanLogic(project.backend_owner, project.backend_repo, project.backend_branch, backToken)
            ]);
            allRoutes = [...frontendRoutes, ...backendRoutes];
        }

        // Run Alignment
        const { aligned, frontendOrphans, stats } = alignRoutes(allRoutes);

        console.log(`✅ Scan Complete for ${project.name}. Score: ${stats.healthScore}%`);

        // Prepare Data Object for DB and Response
        const resultData = {
            aligned,
            frontendOrphans,
            stats,
            allRoutes // Optional: store raw routes if you want
        };

        // 4. SAVE TO DB (History)
        await db.execute(
            `INSERT INTO Scans 
            (project_id, status, total_routes, drifts_found, matched_routes, results, completed_at) 
            VALUES (?, 'completed', ?, ?, ?, ?, NOW())`,
            [
                project.id,
                stats.totalMatches + stats.totalMismatches + stats.totalOrphans, // Total Routes
                stats.totalMismatches, // Drifts
                stats.totalMatches, // Matched
                JSON.stringify(resultData) // The detailed JSON
            ]
        );

        // 5. UPDATE PROJECT HEADERS
        await db.execute(
            'UPDATE Projects SET health_score = ?, last_scanned_at = NOW() WHERE id = ?',
            [stats.healthScore, project.id]
        );

        // 6. RETURN RESPONSE
        res.json({
            success: true,
            data: {
                project: {
                    name: project.name,
                    environment: project.environment,
                    lastScanned: new Date()
                },
                ...resultData
            }
        });

    } catch (error) {
        console.error("Scan Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- ROUTE: GLOBAL USER HISTORY ---
router.get('/history', async (req, res) => {
    // Assuming you have middleware setting req.user.id
    const userId = req.user.id;

    try {
        const [history] = await db.execute(
            `SELECT 
                s.id as scan_id,
                s.status,
                s.total_routes,
                s.drifts_found,
                s.matched_routes,
                s.completed_at,
                p.name as project_name,
                p.uuid as project_uuid,
                p.environment,
                p.health_score as current_project_score -- Optional: for comparison
             FROM Scans s
             JOIN Projects p ON s.project_id = p.id
             WHERE p.user_id = ? 
             ORDER BY s.completed_at DESC`,
            [userId]
        );

        const formattedHistory = history.map(scan => {
            // Calculate the score AT THE TIME of the scan
            // (matched / total) * 100
            const historicalScore = scan.total_routes > 0
                ? Math.round((scan.matched_routes / scan.total_routes) * 100)
                : 0;

            return {
                id: scan.scan_id,
                project: {
                    name: scan.project_name,
                    uuid: scan.project_uuid,
                    env: scan.environment
                },
                date: scan.completed_at,
                status: scan.status,
                stats: {
                    total: scan.total_routes,
                    drift: scan.drifts_found,
                    matched: scan.matched_routes,
                    score: historicalScore
                }
            };
        });

        res.json({ success: true, history: formattedHistory });

    } catch (error) {
        console.error("Global History Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;