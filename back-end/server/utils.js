const crypto = require('crypto');

// --- LEVENSHTEIN DISTANCE (Case Insensitive) ---
function levenshtein(a, b) {
    // Normalize case to stop 'N' vs 'n' from counting as a difference
    a = a.toLowerCase();
    b = b.toLowerCase();

    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

function normalizePath(path) {
    if (!path) return '';

    let clean = path.toLowerCase(); // Rule 1: Always case-insensitive

    // Rule 2: Remove Query Params (e.g. /user?id=1 -> /user)
    clean = clean.split('?')[0];

    // Rule 3: Remove Trailing Slash (e.g. /user/ -> /user)
    if (clean.endsWith('/') && clean.length > 1) {
        clean = clean.slice(0, -1);
    }

    return clean;
}

// --- ALIGNMENT LOGIC ---
function alignRoutes(allRoutes) {

    const definitions = allRoutes.filter(r => r.type === 'definition').map(d => ({
        ...d,
        normalizedPath: normalizePath(d.path)
    }));

    // Pre-process consumptions
    let availableConsumptions = allRoutes.filter(r => r.type === 'consumption').map(c => ({
        ...c,
        normalizedPath: normalizePath(c.path)
    }));

    const results = new Map();

    // 1. Initialize
    definitions.forEach(def => {
        results.set(def.file + def.lineNumber, {
            def,
            matches: [],
            status: 'orphaned',
            issue: 'Orphaned - No frontend calls'
        });
    });

    // 2. PASS 1: EXACT MATCHES
    definitions.forEach(def => {
        const key = def.file + def.lineNumber;

        const exactMatches = availableConsumptions.filter(cons =>
            // Compare the CLEAN versions
            cons.normalizedPath === def.normalizedPath &&
            cons.method.toUpperCase() === def.method.toUpperCase()
        );

        if (exactMatches.length > 0) {
            results.set(key, { def, matches: exactMatches, status: 'matched', issue: '' });
            availableConsumptions = availableConsumptions.filter(c => !exactMatches.includes(c));
        }
    });

    // 3. PASS 2: METHOD MISMATCHES
    definitions.forEach(def => {
        const key = def.file + def.lineNumber;
        if (results.get(key).status === 'matched') return;

        const methodMismatches = availableConsumptions.filter(cons =>
            cons.normalizedPath === def.normalizedPath // Path matches...
        );

        if (methodMismatches.length > 0) {
            results.set(key, {
                def,
                matches: methodMismatches,
                status: 'mismatch',
                issue: `Method mismatch: ${methodMismatches[0].method} vs ${def.method}`
            });
            availableConsumptions = availableConsumptions.filter(c => !methodMismatches.includes(c));
        }
    });

    // 4. PASS 3: FUZZY / TYPO MATCHES
    definitions.forEach(def => {
        const key = def.file + def.lineNumber;
        if (results.get(key).status !== 'orphaned') return;

        let bestMatch = null;
        let minDistance = Infinity;

        availableConsumptions.forEach(cons => {
            const defPath = def.path.toLowerCase();
            const consPath = cons.path.toLowerCase();

            // --- RULE A: CONTAINMENT FORCE MATCH ---
            // If one contains the other, it's almost certainly a match (e.g. "downloadNote" in "downloadNotessss")
            // We ignore very short paths (like "/") to prevent false positives
            if (defPath.length > 4 && consPath.length > 4) {
                if (consPath.includes(defPath) || defPath.includes(consPath)) {
                    // Assign a super low pseudo-distance to prioritize this
                    const dist = Math.abs(consPath.length - defPath.length) * 0.1;
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestMatch = cons;
                    }
                    return; // Skip normal Levenshtein calc for this pair
                }
            }

            // --- RULE B: LEVENSHTEIN DISTANCE ---
            const dist = levenshtein(cons.path, def.path);
            const maxLength = Math.max(cons.path.length, def.path.length);

            // Allow typos up to 40% of the string length (very permissive)
            // or a hard minimum of 7 characters difference
            const threshold = Math.max(7, Math.floor(maxLength * 0.4));

            if (dist <= threshold && dist < minDistance) {
                minDistance = dist;
                bestMatch = cons;
            }
        });

        if (bestMatch) {
            results.set(key, {
                def,
                matches: [bestMatch],
                status: 'mismatch',
                issue: `Path mismatch: ${bestMatch.path}`
            });
            availableConsumptions = availableConsumptions.filter(c => c !== bestMatch);
        }
    });

    // 5. CLEANUP & RETURN
    // Strip the internal 'normalizedPath' property so it doesn't clutter your API response
    const aligned = Array.from(results.values()).map(item => ({
        ...item,
        def: { ...item.def, normalizedPath: undefined },
        matches: item.matches.map(m => ({ ...m, normalizedPath: undefined }))
    }));

    const frontendOrphans = availableConsumptions.map(c => ({ ...c, normalizedPath: undefined }));

    const totalRoutes = aligned.length + frontendOrphans.length;
    const totalMatches = aligned.filter(a => a.status === 'matched').length;
    const healthScore = totalRoutes === 0 ? 0 : ((totalMatches / totalRoutes) * 100).toFixed(2);

    return {
        aligned,
        frontendOrphans,
        stats: {
            totalMatches,
            totalMismatches: aligned.filter(a => a.status === 'mismatch').length,
            totalOrphans: aligned.filter(a => a.status === 'orphaned').length + frontendOrphans.length,
            healthScore
        }
    };
}

function decrypt(text) {
    if (!text) return text;
    // Check if it looks encrypted (contains ':') to avoid crashing on legacy plain-text data
    if (!text.includes(':')) return text; 

    try {
        let textParts = text.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY, 'hex'), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error("Decryption failed:", e.message);
        return null; // Return null if decryption fails so calling functions know
    }
}

module.exports = { alignRoutes, decrypt };