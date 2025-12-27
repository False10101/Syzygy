const router = require('express').Router();
const db = require('../db');
const { Octokit } = require('octokit');
const crypto = require('crypto');

// --- Helper Functions for Encryption ---
const IV_LENGTH = 16; 

function encrypt(text) {
    if (!process.env.ENCRYPTION_KEY) throw new Error("Missing ENCRYPTION_KEY");
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!process.env.ENCRYPTION_KEY) throw new Error("Missing ENCRYPTION_KEY");
    if (!text) return text;
    
    // SAFETY CHECK: If text doesn't look encrypted (no colon), return it as-is.
    // This prevents crashing if you have old plain-text tokens in the DB.
    if (!text.includes(':')) return text; 

    try {
        let textParts = text.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY, 'hex'), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (err) {
        console.error("Decryption failed for a token:", err.message);
        return "INVALID_TOKEN_DATA"; // Return placeholder instead of crashing
    }
}

// GET all tokens
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name, provider, access_token, created_at FROM GitCredentials WHERE user_id = ? ORDER BY created_at DESC', 
            [req.user.id]
        );

        const tokens = rows.map(t => ({
            ...t,
            // We decrypt it just to check validity, but mask it for the UI
            access_token: "••••••••" + decrypt(t.access_token).slice(-4) 
        }));
        
        // --- FIX: Wrap in object to match frontend expectation ---
        res.json({ success: true, tokens }); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

// ADD a new token
router.post('/', async (req, res) => {
    const userId = req.user.id;
    const { name, token } = req.body;

    if (!name || !token) return res.status(400).json({ error: "Name and Token are required" });

    // 1. Verify with GitHub
    try {
        const octokit = new Octokit({ auth: token });
        await octokit.rest.users.getAuthenticated(); 
    } catch (ghError) {
        return res.status(400).json({ error: "Token verification failed. Please check permissions." });
    }

    // 2. Encrypt & Save
    try {
        const encryptedToken = encrypt(token);
        
        await db.execute(
            'INSERT INTO GitCredentials (user_id, name, access_token, provider) VALUES (?, ?, ?, ?)',
            [userId, name, encryptedToken, 'github']
        );
        res.json({ success: true });
    } catch (dbError) {
        console.error(dbError);
        res.status(500).json({ error: "Database error. Could not save token." });
    }
});

// DELETE a token
router.delete('/:id', async (req, res) => {
    const userId = req.user.id;
    const tokenId = req.params.id;

    try {
        const [result] = await db.execute(
            'DELETE FROM GitCredentials WHERE id = ? AND user_id = ?',
            [tokenId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Token not found" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete token" });
    }
});

module.exports = router;