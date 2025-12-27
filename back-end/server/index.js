const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authMiddleware = require('./middleware/auth.js');

dotenv.config();
const app = express();

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true 
}));

app.use(express.json());
app.use(cookieParser());

// --- ROUTES ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tokens', authMiddleware,require('./routes/tokens'));
app.use('/api/github', authMiddleware, require('./routes/github'));
app.use('/api/scan', authMiddleware, require('./routes/scan'));
app.use('/api/user', authMiddleware, require('./routes/user.js'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`⚡ Syzygy API running on port ${PORT}`));