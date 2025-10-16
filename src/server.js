const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - ORDER MATTERS!
app.use(cors());
app.use(express.json());

// Simple test route FIRST
app.get('/test', (req, res) => {
  res.json({ message: 'Test works!' });
});

// Load routes
const routes = require('./routes');
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 DNATE Question Bot API',
    version: '1.0.0',
    status: 'running'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   🚀 DNATE QUESTION BOT API       ║
║   Port: ${PORT}                      ║
╚════════════════════════════════════╝
  `);
  console.log(`\n✅ Server: http://localhost:${PORT}\n`);
});
