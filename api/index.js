const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import routes - mount at root since vercel routes /api/* to this handler
const apiRoutes = require('../src/routes/api');
app.use('/', apiRoutes);

module.exports = app;
