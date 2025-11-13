/**
 * Calculations routes
 * Handles implementation hour calculations based on backend parameters
 */

const express = require('express');
const { getDb } = require('../database/init');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/calculations/implementation-hours
 * Calculate implementation hours based on package, modules, and truck count
 */
router.post('/implementation-hours', (req, res) => {
  const { packageId, moduleIds, numberOfTrucks } = req.body;

  if (!packageId || !numberOfTrucks || numberOfTrucks <= 0) {
    return res.status(400).json({ error: 'Package ID and valid truck count required' });
  }

  const db = getDb();

  // Get calculation parameters
  db.all('SELECT parameterName, parameterValue FROM calculation_parameters', (err, params) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Convert parameters to object for easy access
    const parameters = {};
    params.forEach((param) => {
      parameters[param.parameterName] = param.parameterValue;
    });

    // Get package to determine multiplier
    db.get('SELECT name FROM packages WHERE id = ?', [packageId], (err, pkg) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!pkg) {
        return res.status(404).json({ error: 'Package not found' });
      }

      // Determine multiplier based on package
      let multiplier = 1.0;
      if (pkg.name === 'TMWSuite Foundations') {
        multiplier = parameters.foundations_multiplier || 1.0;
      } else if (pkg.name === 'TMWSuite Professional') {
        multiplier = parameters.professional_multiplier || 1.5;
      } else if (pkg.name === 'TMWSuite Professional Plus') {
        multiplier = parameters.professional_plus_multiplier || 2.0;
      }

      // Calculate base hours
      const baseHoursPerTruck = parameters.base_hours_per_truck || 8;
      const baseHours = baseHoursPerTruck * numberOfTrucks * multiplier;

      // Calculate additional hours for modules
      const moduleHoursPerTruck = parameters.module_hours_per_truck || 2;
      const moduleCount = Array.isArray(moduleIds) ? moduleIds.length : 0;
      const moduleHours = moduleHoursPerTruck * numberOfTrucks * moduleCount;

      // Total implementation hours
      const totalHours = baseHours + moduleHours;

      res.json({
        baseHours: Math.round(baseHours * 100) / 100,
        moduleHours: Math.round(moduleHours * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
        numberOfTrucks,
        moduleCount,
        multiplier
      });
    });
  });
});

/**
 * GET /api/calculations/parameters
 * Get all calculation parameters (Admin only)
 */
router.get('/parameters', requireRole('admin'), (req, res) => {
  const db = getDb();

  db.all('SELECT * FROM calculation_parameters ORDER BY parameterName', (err, params) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(params);
  });
});

/**
 * PUT /api/calculations/parameters/:id
 * Update a calculation parameter (Admin only)
 */
router.put('/parameters/:id', requireRole('admin'), (req, res) => {
  const { parameterValue, description } = req.body;
  const paramId = req.params.id;

  if (parameterValue === undefined) {
    return res.status(400).json({ error: 'Parameter value required' });
  }

  const db = getDb();

  db.run(
    'UPDATE calculation_parameters SET parameterValue = ?, description = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [parameterValue, description || null, paramId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Parameter not found' });
      }

      res.json({ message: 'Parameter updated successfully' });
    }
  );
});

module.exports = router;

