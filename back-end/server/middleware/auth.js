const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.cookies.token; // Read from Cookie
    if (!token) return res.status(401).json({ error: "Access Denied" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // { id: 1 }
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid Token" });
    }
};