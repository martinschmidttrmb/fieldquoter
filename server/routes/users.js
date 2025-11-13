/**
 * Users routes
 * Handles user management operations
 */

const express = require('express');
const { getDb } = require('../database/init');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/users
 * Get users based on role:
 * - Admins: all users
 * - Managers: their team members
 * - General Users: not allowed
 */
router.get('/', (req, res) => {
  const db = getDb();
  let query;
  let params = [];

  if (req.user.role === 'admin') {
    // Admins see all users
    query = `
      SELECT u.id, u.email, u.firstName, u.lastName, u.role, u.managerId, u.createdAt,
             m.firstName || ' ' || m.lastName as managerName
      FROM users u
      LEFT JOIN users m ON u.managerId = m.id
      ORDER BY u.role, u.lastName, u.firstName
    `;
  } else if (req.user.role === 'manager') {
    // Managers see their team members
    query = `
      SELECT u.id, u.email, u.firstName, u.lastName, u.role, u.managerId, u.createdAt
      FROM users u
      WHERE u.managerId = ?
      ORDER BY u.lastName, u.firstName
    `;
    params = [req.user.id];
  } else {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all(query, params, (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Remove password field (shouldn't be in DB query, but just in case)
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  });
});

/**
 * GET /api/users/team
 * Get team members for current manager
 */
router.get('/team', requireRole(['admin', 'manager']), (req, res) => {
  const db = getDb();
  const managerId = req.user.role === 'admin' ? (req.query.managerId || req.user.id) : req.user.id;

  db.all(
    `SELECT u.id, u.email, u.firstName, u.lastName, u.role, u.createdAt,
            COUNT(q.id) as quoteCount
     FROM users u
     LEFT JOIN quotes q ON u.id = q.userId
     WHERE u.managerId = ?
     GROUP BY u.id
     ORDER BY u.lastName, u.firstName`,
    [managerId],
    (err, teamMembers) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(teamMembers);
    }
  );
});

/**
 * GET /api/users/:id
 * Get a specific user
 */
router.get('/:id', (req, res) => {
  const userId = req.params.id;
  const db = getDb();

  // Users can only see themselves unless they're admin/manager
  if (req.user.role === 'general' && parseInt(userId) !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.get(
    `SELECT u.id, u.email, u.firstName, u.lastName, u.role, u.managerId, u.createdAt,
            m.firstName || ' ' || m.lastName as managerName
     FROM users u
     LEFT JOIN users m ON u.managerId = m.id
     WHERE u.id = ?`,
    [userId],
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

module.exports = router;

