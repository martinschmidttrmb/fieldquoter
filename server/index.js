/**
 * Main server file for Field Quoter Application
 * This handles all API requests and serves the backend logic
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import route handlers
const authRoutes = require('./routes/auth');
const quoteRoutes = require('./routes/quotes');
const packageRoutes = require('./routes/packages');
const userRoutes = require('./routes/users');
const calculationRoutes = require('./routes/calculations');

// Import database initialization
const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors()); // Allow frontend to communicate with backend
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/calculations', calculationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Field Quoter API is running' });
});

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database initialized successfully`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  });

