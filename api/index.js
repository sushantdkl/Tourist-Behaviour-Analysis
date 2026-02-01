const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug endpoint to check paths
app.get('/api/debug', (req, res) => {
    const paths = {
        __dirname: __dirname,
        cwd: process.cwd(),
        files_in_cwd: fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()).slice(0, 20) : 'not found',
        src_exists: fs.existsSync(path.join(process.cwd(), 'src')),
        src_data_exists: fs.existsSync(path.join(process.cwd(), 'src', 'data')),
    };
    
    if (paths.src_data_exists) {
        paths.data_files = fs.readdirSync(path.join(process.cwd(), 'src', 'data'));
    }
    
    res.json(paths);
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes
try {
    const apiRoutes = require('../src/routes/api');
    app.use('/api', apiRoutes);
} catch (err) {
    app.use('/api', (req, res) => {
        res.status(500).json({ 
            error: 'Failed to load routes', 
            message: err.message,
            stack: err.stack 
        });
    });
}

// Export for Vercel serverless
module.exports = app;
