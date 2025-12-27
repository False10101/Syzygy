const router = require('express').Router();
const { Octokit } = require('octokit');
const db = require('../db');
const { decrypt } = require('../utils');

// Helper to get token
async function getToken(credentialId) {
    const [rows] = await db.execute('SELECT access_token FROM GitCredentials WHERE id = ?', [credentialId]);
    if (rows.length === 0) throw new Error("Credential not found");
    
    const rawToken = rows[0].access_token;
    const token = decrypt(rawToken);
    
    if (!token) throw new Error("Failed to decrypt token");
    
    return token;
}

// LIST REPOS
router.get('/repos', async (req, res) => {
    const { credentialId } = req.query;

    try {
        const token = await getToken(credentialId);
        const octokit = new Octokit({ auth: token });

        const { data } = await octokit.rest.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 100, // Increased to 100 to ensure we grab enough to filter
            visibility: 'all',
            mediaType: {
                previews: ['mercy'] 
            }
        });

        const simplified = data.map(repo => ({
            id: repo.id,
            name: repo.name,
            owner: repo.owner.login,
            default_branch: repo.default_branch,
            private: repo.private,
            language: repo.language || "Unknown",
            topics: repo.topics || [] 
        }));

        res.json(simplified);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// LIST BRANCHES
router.get('/branches/:owner/:repo', async (req, res) => {
    const { owner, repo } = req.params;
    const { credentialId } = req.query;

    try {
        const token = await getToken(credentialId);
        const octokit = new Octokit({ auth: token });

        const { data } = await octokit.rest.repos.listBranches({ owner, repo });
        res.json(data.map(b => b.name));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;