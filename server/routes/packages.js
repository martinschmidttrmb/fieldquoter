/**
 * Packages routes
 * Handles CRUD operations for TMWSuite packages
 */

const express = require('express');
const { getDb } = require('../database/init');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/packages
 * Get all packages with their modules
 */
router.get('/', (req, res) => {
  const db = getDb();

  // Get all packages
  db.all('SELECT * FROM packages ORDER BY id', (err, packages) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get modules for each package
    const packagePromises = packages.map((pkg) => {
      return new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM modules WHERE packageId = ? ORDER BY id',
          [pkg.id],
          (err, modules) => {
            if (err) {
              reject(err);
              return;
            }
            resolve({ ...pkg, modules: modules || [] });
          }
        );
      });
    });

    Promise.all(packagePromises)
      .then((packagesWithModules) => {
        res.json(packagesWithModules);
      })
      .catch((error) => {
        res.status(500).json({ error: 'Error fetching modules' });
      });
  });
});

/**
 * GET /api/packages/:id
 * Get a specific package with its modules
 */
router.get('/:id', (req, res) => {
  const db = getDb();
  const packageId = req.params.id;

  db.get('SELECT * FROM packages WHERE id = ?', [packageId], (err, pkg) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Get modules for this package
    db.all(
      'SELECT * FROM modules WHERE packageId = ? ORDER BY id',
      [packageId],
      (err, modules) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ ...pkg, modules: modules || [] });
      }
    );
  });
});

/**
 * POST /api/packages
 * Create a new package (Admin only)
 */
router.post('/', requireRole('admin'), (req, res) => {
  const { name, description, basePrice } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Package name required' });
  }

  const db = getDb();

  db.run(
    'INSERT INTO packages (name, description, basePrice) VALUES (?, ?, ?)',
    [name, description || null, basePrice || 0],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'Package name already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        message: 'Package created successfully',
        packageId: this.lastID
      });
    }
  );
});

/**
 * POST /api/packages/:id/modules
 * Add a module to a package (Admin only)
 */
router.post('/:id/modules', requireRole('admin'), (req, res) => {
  const packageId = req.params.id;
  const { name, description, basePrice } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Module name required' });
  }

  const db = getDb();

  // Verify package exists
  db.get('SELECT id FROM packages WHERE id = ?', [packageId], (err, pkg) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Insert module
    db.run(
      'INSERT INTO modules (name, description, packageId, basePrice) VALUES (?, ?, ?, ?)',
      [name, description || null, packageId, basePrice || 0],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({
          message: 'Module added successfully',
          moduleId: this.lastID
        });
      }
    );
  });
});

module.exports = router;

