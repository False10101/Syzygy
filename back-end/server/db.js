const mysql = require('mysql2');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Define the path to your certificate file
// Assuming the .pem file is in the 'server' root folder alongside index.js
const sslCertPath = path.join(__dirname, 'isrgrootx1.pem');

// Check if SSL should be used (if the file exists)
const sslConfig = fs.existsSync(sslCertPath) 
    ? { ca: fs.readFileSync(sslCertPath) } 
    : undefined;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT, // Good practice to allow port config
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Add the SSL config here
    ssl: sslConfig
});

console.log(`🔌 Database connecting to ${process.env.DB_HOST}...`);
if (sslConfig) {
    console.log("🔒 SSL Certificate found and enabled.");
}

// Convert to promises so we can use async/await
module.exports = pool.promise();