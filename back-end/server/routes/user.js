const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');


// Get User Profile
router.get('/profile', async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, email, full_name, avatar_url FROM Users WHERE id = ?', 
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ error: "User not found" });
        res.json({ success: true, user: users[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update User Profile
router.put('/profile', async (req, res) => {
    const { full_name, email } = req.body;
    try {
        await db.execute(
            'UPDATE Users SET full_name = ?, email = ? WHERE id = ?',
            [full_name, email, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PROJECT CONFIG ROUTES ---

// Get Projects List (for the dropdown)
// router.get('/projects/list', async (req, res) => {
//     try {
//         const [projects] = await db.execute(
//             'SELECT id, name, environment, uuid FROM Projects WHERE user_id = ? ORDER BY name ASC',
//             [req.user.id]
//         );
//         res.json({ success: true, projects });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// Get Config for specific Project
// router.get('/projects/:projectId/config', async (req, res) => {
//     try {
//         // Check ownership
//         const [auth] = await db.execute('SELECT id FROM Projects WHERE id = ? AND user_id = ?', [req.params.projectId, req.user.id]);
//         if (auth.length === 0) return res.status(403).json({ error: "Unauthorized" });

//         const [configs] = await db.execute('SELECT * FROM ProjectConfigs WHERE project_id = ?', [req.params.projectId]);
        
//         // Return default if no config exists yet
//         if (configs.length === 0) {
//             return res.json({ 
//                 success: true, 
//                 config: {
//                     ignore_patterns: [],
//                     ignore_trailing_slash: 1,
//                     check_query_params: 1,
//                     case_sensitive: 0,
//                     validate_http_methods: 1
//                 }
//             });
//         }

//         res.json({ success: true, config: configs[0] });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });

// Upsert Config
// router.put('/projects/:projectId/config', async (req, res) => {
//     const { ignore_patterns, ignore_trailing_slash, check_query_params, case_sensitive, validate_http_methods } = req.body;
    
//     try {
//         // Check ownership
//         const [auth] = await db.execute('SELECT id FROM Projects WHERE id = ? AND user_id = ?', [req.params.projectId, req.user.id]);
//         if (auth.length === 0) return res.status(403).json({ error: "Unauthorized" });

//         // Upsert Logic (Insert if not exists, otherwise update)
//         await db.execute(`
//             INSERT INTO ProjectConfigs (project_id, ignore_patterns, ignore_trailing_slash, check_query_params, case_sensitive, validate_http_methods)
//             VALUES (?, ?, ?, ?, ?, ?)
//             ON DUPLICATE KEY UPDATE
//             ignore_patterns = VALUES(ignore_patterns),
//             ignore_trailing_slash = VALUES(ignore_trailing_slash),
//             check_query_params = VALUES(check_query_params),
//             case_sensitive = VALUES(case_sensitive),
//             validate_http_methods = VALUES(validate_http_methods)
//         `, [
//             req.params.projectId, 
//             JSON.stringify(ignore_patterns), 
//             ignore_trailing_slash, 
//             check_query_params, 
//             case_sensitive, 
//             validate_http_methods
//         ]);

//         res.json({ success: true });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: err.message });
//     }
// });

// --- NEW: CHANGE PASSWORD ---
router.put('/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        // 1. Get current hash
        const [users] = await db.execute('SELECT password_hash FROM Users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: "User not found" });

        // 2. Verify current password
        const match = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!match) return res.status(401).json({ error: "Incorrect current password" });

        // 3. Hash new password & Update
        const newHash = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE Users SET password_hash = ? WHERE id = ?', [newHash, userId]);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- NEW: DELETE ACCOUNT ---
router.delete('/account', async (req, res) => {
    try {
        await db.execute('DELETE FROM Users WHERE id = ?', [req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;