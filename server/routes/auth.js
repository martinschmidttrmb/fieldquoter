/**
 * Authentication routes
 * Handles user login, registration, and token management
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Login endpoint - returns JWT token
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const db = getDb();

  // Find user by email
  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return user info (without password) and token
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          managerId: user.managerId
        }
      });
    }
  );
});

/**
 * POST /api/auth/register
 * Register new user (only admins and managers can create users)
 */
router.post('/register', authenticateToken, (req, res) => {
  // Only admins and managers can register new users
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Only admins and managers can create users' });
  }

  const { email, password, firstName, lastName, role, managerId } = req.body;

  if (!email || !password || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'All fields required' });
  }

  // Validate role
  if (!['admin', 'manager', 'general'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // If manager is creating a user, set managerId to current user
  const finalManagerId = req.user.role === 'manager' ? req.user.id : (managerId || null);

  const db = getDb();

  // Hash password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    }

    // Insert new user
    db.run(
      `INSERT INTO users (email, password, firstName, lastName, role, managerId) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, firstName, lastName, role, finalManagerId],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({
          message: 'User created successfully',
          userId: this.lastID
        });
      }
    );
  });
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();

  db.get(
    'SELECT id, email, firstName, lastName, role, managerId, createdAt FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    }
  );
});

/**
 * POST /api/auth/impersonate
 * Admin-only endpoint to impersonate another user
 */
router.post('/impersonate', authenticateToken, (req, res) => {
  // Only admins can impersonate
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can impersonate users' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const db = getDb();

  // Get user to impersonate
  db.get(
    'SELECT id, email, firstName, lastName, role, managerId FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Generate token for impersonated user (with admin flag)
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          impersonatedBy: req.user.id, // Track who is impersonating
          isImpersonating: true
        },
        JWT_SECRET,
        { expiresIn: '1h' } // Shorter expiration for impersonation
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          managerId: user.managerId
        },
        impersonatedBy: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`
        }
      });
    }
  );
});

module.exports = router;

