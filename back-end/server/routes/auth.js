const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// REGISTER
router.post('/register', async (req, res) => {
    const { email, password, full_name } = req.body;
    
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    try {
        // Check if user exists
        const [existing] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: "Email already exists" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Insert
        await db.execute(
            'INSERT INTO Users (email, password_hash, full_name) VALUES (?, ?, ?)', 
            [email, hash, full_name]
        );

        res.json({ success: true, message: "User created" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ error: "User not found" });

        const user = users[0];
        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) return res.status(400).json({ error: "Invalid password" });

        // Create Token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
        
        // 🔴 SET COOKIE HERE
        res.cookie('token', token, {
            httpOnly: true, // Frontend JS cannot read this (Security)
            secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 Day
        });

        // Send back user info (but NOT the token, it's in the cookie now)
        res.json({ 
            success: true, 
            user: { id: user.id, email: user.email, name: user.full_name, avatar: user.avatar_url } 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGOUT (New)
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// CHECK AUTH (For that useEffect in your Note.js)
router.get('/me', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        // Fetch fresh user data if needed
        const [users] = await db.execute('SELECT id, email, full_name, avatar_url FROM Users WHERE id = ?', [verified.id]);
        res.json({ user: users[0] });
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
});

module.exports = router;