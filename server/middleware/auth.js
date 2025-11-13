/**
 * Authentication middleware
 * Verifies JWT tokens and attaches user information to requests
 */

const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to verify JWT token and authenticate user
 */
function authenticateToken(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Verify token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  });
}

/**
 * Middleware to check if user has required role
 * Usage: requireRole('admin') or requireRole(['admin', 'manager'])
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Middleware to check if user can access a specific quote
 * Admins can access all, Managers can access their team's quotes, Users can only access their own
 */
function canAccessQuote(req, res, next) {
  const quoteId = req.params.id || req.body.quoteId;
  const db = getDb();

  if (!quoteId) {
    return res.status(400).json({ error: 'Quote ID required' });
  }

  // Admins can access everything
  if (req.user.role === 'admin') {
    return next();
  }

  // Get quote from database
  db.get(
    'SELECT userId, sharedWithManagerId FROM quotes WHERE id = ?',
    [quoteId],
    (err, quote) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // User can access their own quotes
      if (quote.userId === req.user.id) {
        return next();
      }

      // Managers can access quotes from their team members
      if (req.user.role === 'manager') {
        db.get(
          'SELECT id FROM users WHERE id = ? AND managerId = ?',
          [quote.userId, req.user.id],
          (err, teamMember) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            if (teamMember || quote.sharedWithManagerId === req.user.id) {
              return next();
            }

            return res.status(403).json({ error: 'Access denied' });
          }
        );
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
  );
}

module.exports = {
  authenticateToken,
  requireRole,
  canAccessQuote,
  JWT_SECRET
};

