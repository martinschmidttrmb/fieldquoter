/**
 * Quotes routes
 * Handles CRUD operations for quotes
 */

const express = require('express');
const { getDb } = require('../database/init');
const { authenticateToken, requireRole, canAccessQuote } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/quotes
 * Get quotes based on user role:
 * - Admins: all quotes
 * - Managers: quotes from their team members
 * - General Users: only their own quotes
 */
router.get('/', (req, res) => {
  const db = getDb();
  let query;
  let params = [];

  if (req.user.role === 'admin') {
    // Admins see all quotes
    query = `
      SELECT q.*, 
             p.name as packageName,
             u.firstName || ' ' || u.lastName as createdBy,
             COUNT(qm.id) as moduleCount
      FROM quotes q
      LEFT JOIN packages p ON q.packageId = p.id
      LEFT JOIN users u ON q.userId = u.id
      LEFT JOIN quote_modules qm ON q.id = qm.quoteId
      GROUP BY q.id
      ORDER BY q.createdAt DESC
    `;
  } else if (req.user.role === 'manager') {
    // Managers see quotes from their team members
    query = `
      SELECT q.*, 
             p.name as packageName,
             u.firstName || ' ' || u.lastName as createdBy,
             COUNT(qm.id) as moduleCount
      FROM quotes q
      LEFT JOIN packages p ON q.packageId = p.id
      LEFT JOIN users u ON q.userId = u.id
      LEFT JOIN quote_modules qm ON q.id = qm.quoteId
      WHERE u.managerId = ? OR q.sharedWithManagerId = ?
      GROUP BY q.id
      ORDER BY q.createdAt DESC
    `;
    params = [req.user.id, req.user.id];
  } else {
    // General users see only their own quotes
    query = `
      SELECT q.*, 
             p.name as packageName,
             u.firstName || ' ' || u.lastName as createdBy,
             COUNT(qm.id) as moduleCount
      FROM quotes q
      LEFT JOIN packages p ON q.packageId = p.id
      LEFT JOIN users u ON q.userId = u.id
      LEFT JOIN quote_modules qm ON q.id = qm.quoteId
      WHERE q.userId = ?
      GROUP BY q.id
      ORDER BY q.createdAt DESC
    `;
    params = [req.user.id];
  }

  db.all(query, params, (err, quotes) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Get modules for each quote
    const quotePromises = quotes.map((quote) => {
      return new Promise((resolve, reject) => {
        db.all(
          `SELECT m.*, qm.quantity, qm.price 
           FROM quote_modules qm
           JOIN modules m ON qm.moduleId = m.id
           WHERE qm.quoteId = ?`,
          [quote.id],
          (err, modules) => {
            if (err) {
              reject(err);
              return;
            }
            resolve({ ...quote, modules: modules || [] });
          }
        );
      });
    });

    Promise.all(quotePromises)
      .then((quotesWithModules) => {
        res.json(quotesWithModules);
      })
      .catch((error) => {
        res.status(500).json({ error: 'Error fetching modules' });
      });
  });
});

/**
 * GET /api/quotes/:id
 * Get a specific quote
 */
router.get('/:id', canAccessQuote, (req, res) => {
  const db = getDb();
  const quoteId = req.params.id;

  db.get(
    `SELECT q.*, 
            p.name as packageName,
            u.firstName || ' ' || u.lastName as createdBy
     FROM quotes q
     LEFT JOIN packages p ON q.packageId = p.id
     LEFT JOIN users u ON q.userId = u.id
     WHERE q.id = ?`,
    [quoteId],
    (err, quote) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!quote) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Get modules for this quote
      db.all(
        `SELECT m.*, qm.quantity, qm.price 
         FROM quote_modules qm
         JOIN modules m ON qm.moduleId = m.id
         WHERE qm.quoteId = ?`,
        [quoteId],
        (err, modules) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ ...quote, modules: modules || [] });
        }
      );
    }
  );
});

/**
 * POST /api/quotes
 * Create a new quote
 */
router.post('/', (req, res) => {
  const {
    customerName,
    customerEmail,
    packageId,
    numberOfTrucks,
    moduleIds,
    discount,
    notes
  } = req.body;

  // Validation
  if (!customerName || !packageId || !numberOfTrucks || numberOfTrucks <= 0) {
    return res.status(400).json({ error: 'Customer name, package ID, and valid truck count required' });
  }

  const db = getDb();

  // Get package and modules to calculate pricing
  db.get('SELECT * FROM packages WHERE id = ?', [packageId], (err, pkg) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Calculate subtotal
    let subtotal = pkg.basePrice || 0;

    // Get selected modules and calculate their prices
    const modulePromises = (moduleIds || []).map((moduleId) => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM modules WHERE id = ?', [moduleId], (err, module) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(module);
        });
      });
    });

    Promise.all(modulePromises)
      .then((modules) => {
        const validModules = modules.filter((m) => m !== undefined);
        const moduleTotal = validModules.reduce((sum, m) => sum + (m.basePrice || 0), 0);
        subtotal += moduleTotal;

        // Calculate implementation hours
        const calculationRequest = {
          packageId,
          moduleIds: validModules.map((m) => m.id),
          numberOfTrucks
        };

        // Make internal calculation call (simplified - in production, you'd call the calculation service)
        // For now, we'll calculate it here
        db.all('SELECT parameterName, parameterValue FROM calculation_parameters', (err, params) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          const parameters = {};
          params.forEach((param) => {
            parameters[param.parameterName] = param.parameterValue;
          });

          let multiplier = 1.0;
          if (pkg.name === 'TMWSuite Foundations') {
            multiplier = parameters.foundations_multiplier || 1.0;
          } else if (pkg.name === 'TMWSuite Professional') {
            multiplier = parameters.professional_multiplier || 1.5;
          } else if (pkg.name === 'TMWSuite Professional Plus') {
            multiplier = parameters.professional_plus_multiplier || 2.0;
          }

          const baseHoursPerTruck = parameters.base_hours_per_truck || 8;
          const baseHours = baseHoursPerTruck * numberOfTrucks * multiplier;
          const moduleHoursPerTruck = parameters.module_hours_per_truck || 2;
          const moduleHours = moduleHoursPerTruck * numberOfTrucks * validModules.length;
          const implementationHours = baseHours + moduleHours;

          // Calculate total with discount
          const discountAmount = discount || 0;
          const total = subtotal - discountAmount;

          // Insert quote
          db.run(
            `INSERT INTO quotes 
             (userId, customerName, customerEmail, packageId, numberOfTrucks, 
              subtotal, discount, total, implementationHours, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              req.user.id,
              customerName,
              customerEmail || null,
              packageId,
              numberOfTrucks,
              subtotal,
              discountAmount,
              total,
              Math.round(implementationHours * 100) / 100,
              notes || null
            ],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              const quoteId = this.lastID;

              // Insert quote modules
              const moduleInserts = validModules.map((module) => {
                return new Promise((resolve, reject) => {
                  db.run(
                    'INSERT INTO quote_modules (quoteId, moduleId, quantity, price) VALUES (?, ?, ?, ?)',
                    [quoteId, module.id, 1, module.basePrice || 0],
                    (err) => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                });
              });

              Promise.all(moduleInserts)
                .then(() => {
                  res.status(201).json({
                    message: 'Quote created successfully',
                    quoteId
                  });
                })
                .catch((error) => {
                  res.status(500).json({ error: 'Error saving modules' });
                });
            }
          );
        });
      })
      .catch((error) => {
        res.status(500).json({ error: 'Error fetching modules' });
      });
  });
});

/**
 * PUT /api/quotes/:id
 * Update a quote
 */
router.put('/:id', canAccessQuote, (req, res) => {
  const quoteId = req.params.id;
  const {
    customerName,
    customerEmail,
    packageId,
    numberOfTrucks,
    moduleIds,
    discount,
    notes
  } = req.body;

  const db = getDb();

  // Similar calculation logic as create
  // For brevity, this is a simplified version
  // In production, you'd want to recalculate everything

  db.run(
    `UPDATE quotes 
     SET customerName = ?, customerEmail = ?, discount = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [customerName, customerEmail, discount || 0, notes, quoteId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      res.json({ message: 'Quote updated successfully' });
    }
  );
});

/**
 * POST /api/quotes/:id/share
 * Share quote with manager for approval
 */
router.post('/:id/share', (req, res) => {
  const quoteId = req.params.id;
  const { managerId } = req.body;

  // Only the quote owner can share it
  const db = getDb();

  db.get('SELECT userId FROM quotes WHERE id = ?', [quoteId], (err, quote) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.userId !== req.user.id) {
      return res.status(403).json({ error: 'Only quote owner can share quotes' });
    }

    // Verify manager exists and is actually a manager
    db.get('SELECT id, role FROM users WHERE id = ? AND role = ?', [managerId, 'manager'], (err, manager) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!manager) {
        return res.status(404).json({ error: 'Manager not found' });
      }

      // Update quote status and sharedWithManagerId
      db.run(
        'UPDATE quotes SET status = ?, sharedWithManagerId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        ['pending_approval', managerId, quoteId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ message: 'Quote shared with manager for approval' });
        }
      );
    });
  });
});

/**
 * POST /api/quotes/:id/approve
 * Approve or reject a quote (Manager only)
 */
router.post('/:id/approve', requireRole(['admin', 'manager']), (req, res) => {
  const quoteId = req.params.id;
  const { approved, discount } = req.body;

  const db = getDb();

  // Verify manager has access to this quote
  db.get('SELECT * FROM quotes WHERE id = ?', [quoteId], (err, quote) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Check access
    if (req.user.role === 'manager') {
      if (quote.sharedWithManagerId !== req.user.id) {
        // Check if quote belongs to a team member
        db.get('SELECT id FROM users WHERE id = ? AND managerId = ?', [quote.userId, req.user.id], (err, teamMember) => {
          if (err || !teamMember) {
            return res.status(403).json({ error: 'Access denied' });
          }
          processApproval();
        });
      } else {
        processApproval();
      }
    } else {
      processApproval();
    }

    function processApproval() {
      const status = approved ? 'approved' : 'rejected';
      const finalDiscount = discount !== undefined ? discount : quote.discount;
      const newTotal = quote.subtotal - finalDiscount;

      db.run(
        `UPDATE quotes 
         SET status = ?, discount = ?, total = ?, updatedAt = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, finalDiscount, newTotal, quoteId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            message: `Quote ${status} successfully`,
            status,
            discount: finalDiscount,
            total: newTotal
          });
        }
      );
    }
  });
});

/**
 * DELETE /api/quotes/:id
 * Delete a quote
 */
router.delete('/:id', canAccessQuote, (req, res) => {
  const quoteId = req.params.id;
  const db = getDb();

  // Only allow deletion of draft quotes or by admins
  db.get('SELECT status, userId FROM quotes WHERE id = ?', [quoteId], (err, quote) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    if (quote.status !== 'draft' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only draft quotes can be deleted' });
    }

    db.run('DELETE FROM quotes WHERE id = ?', [quoteId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'Quote deleted successfully' });
    });
  });
});

module.exports = router;

