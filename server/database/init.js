/**
 * Database initialization file
 * Sets up SQLite database with all necessary tables
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'quoter.db');

// Create database connection
let db = null;

/**
 * Initialize the database and create all tables
 */
function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('📦 Connected to SQLite database');
    });

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create tables
    createTables()
      .then(() => {
        // Insert default data (packages, modules, admin user)
        return insertDefaultData();
      })
      .then(() => {
        console.log('✅ Database initialized successfully');
        resolve();
      })
      .catch((error) => {
        console.error('❌ Error initializing database:', error);
        reject(error);
      });
  });
}

/**
 * Create all database tables
 */
function createTables() {
  return new Promise((resolve, reject) => {
    const tables = [
      // Users table - stores all user information
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'general')),
        managerId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (managerId) REFERENCES users(id)
      )`,

      // Packages table - stores the three TMWSuite packages
      `CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        basePrice REAL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Modules table - stores individual modules that can be added to packages
      `CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        packageId INTEGER,
        basePrice REAL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (packageId) REFERENCES packages(id)
      )`,

      // Quotes table - stores all quotes created by users
      `CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        customerName TEXT NOT NULL,
        customerEmail TEXT,
        packageId INTEGER NOT NULL,
        numberOfTrucks INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        total REAL NOT NULL,
        implementationHours REAL NOT NULL,
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending_approval', 'approved', 'rejected')),
        sharedWithManagerId INTEGER,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (packageId) REFERENCES packages(id),
        FOREIGN KEY (sharedWithManagerId) REFERENCES users(id)
      )`,

      // Quote modules table - links modules to quotes (many-to-many relationship)
      `CREATE TABLE IF NOT EXISTS quote_modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quoteId INTEGER NOT NULL,
        moduleId INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        price REAL NOT NULL,
        FOREIGN KEY (quoteId) REFERENCES quotes(id) ON DELETE CASCADE,
        FOREIGN KEY (moduleId) REFERENCES modules(id)
      )`,

      // Calculation parameters table - stores backend parameters for hour calculations
      `CREATE TABLE IF NOT EXISTS calculation_parameters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parameterName TEXT NOT NULL UNIQUE,
        parameterValue REAL NOT NULL,
        description TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    let completed = 0;
    tables.forEach((tableSQL) => {
      db.run(tableSQL, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          reject(err);
          return;
        }
        completed++;
        if (completed === tables.length) {
          resolve();
        }
      });
    });
  });
}

/**
 * Insert default data into the database
 */
function insertDefaultData() {
  return new Promise((resolve, reject) => {
    // Insert default admin user (password: admin123 - should be changed in production!)
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('admin123', 10);

    db.run(
      `INSERT OR IGNORE INTO users (email, password, firstName, lastName, role) 
       VALUES (?, ?, ?, ?, ?)`,
      ['admin@tmwsuite.com', defaultPassword, 'Admin', 'User', 'admin'],
      (err) => {
        if (err) {
          console.error('Error inserting admin user:', err);
          reject(err);
          return;
        }
      }
    );

    // Insert the three packages
    const packages = [
      ['TMWSuite Foundations', 'Basic package with essential modules', 0],
      ['TMWSuite Professional', 'Professional package with advanced features', 0],
      ['TMWSuite Professional Plus', 'Complete package with all premium features', 0]
    ];

    let packageCount = 0;
    packages.forEach(([name, description, basePrice]) => {
      db.run(
        `INSERT OR IGNORE INTO packages (name, description, basePrice) VALUES (?, ?, ?)`,
        [name, description, basePrice],
        function(err) {
          if (err) {
            console.error('Error inserting package:', err);
            reject(err);
            return;
          }
          packageCount++;
          if (packageCount === packages.length) {
            // Insert sample modules for each package
            insertSampleModules()
              .then(() => {
                // Insert default calculation parameters
                return insertCalculationParameters();
              })
              .then(resolve)
              .catch(reject);
          }
        }
      );
    });
  });
}

/**
 * Insert sample modules for each package
 */
function insertSampleModules() {
  return new Promise((resolve, reject) => {
    // Get package IDs first
    db.all('SELECT id, name FROM packages ORDER BY id', (err, packages) => {
      if (err) {
        reject(err);
        return;
      }

      const modules = [
        // Foundations package modules
        [1, 'Basic Dispatch', 'Core dispatch functionality', 500],
        [1, 'Fleet Management', 'Basic fleet tracking', 750],
        [1, 'Driver Management', 'Driver information and records', 400],
        
        // Professional package modules (includes Foundations + more)
        [2, 'Advanced Dispatch', 'Enhanced dispatch with optimization', 1000],
        [2, 'Route Optimization', 'Intelligent route planning', 1200],
        [2, 'Mobile App', 'Driver mobile application', 800],
        [2, 'ELD Integration', 'Electronic Logging Device integration', 600],
        [2, 'Fuel Management', 'Fuel tracking and management', 900],
        
        // Professional Plus package modules (includes all previous + premium)
        [3, 'Predictive Analytics', 'AI-powered analytics and insights', 1500],
        [3, 'Custom Reporting', 'Advanced custom report builder', 1100],
        [3, 'API Integration', 'Full API access for integrations', 1300],
        [3, 'Priority Support', '24/7 priority customer support', 1000],
        [3, 'Training & Onboarding', 'Comprehensive training program', 1400]
      ];

      let moduleCount = 0;
      modules.forEach(([packageIndex, name, description, basePrice]) => {
        // Find package ID by index (1-based)
        const packageId = packages[packageIndex - 1]?.id;
        if (!packageId) {
          moduleCount++;
          if (moduleCount === modules.length) {
            resolve();
          }
          return;
        }

        db.run(
          `INSERT OR IGNORE INTO modules (name, description, packageId, basePrice) VALUES (?, ?, ?, ?)`,
          [name, description, packageId, basePrice],
          (err) => {
            if (err) {
              console.error('Error inserting module:', err);
              // Continue even if there's an error
            }
            moduleCount++;
            if (moduleCount === modules.length) {
              resolve();
            }
          }
        );
      });
    });
  });
}

/**
 * Insert default calculation parameters for implementation hours
 */
function insertCalculationParameters() {
  return new Promise((resolve, reject) => {
    const parameters = [
      ['base_hours_per_truck', 8, 'Base implementation hours per truck'],
      ['foundations_multiplier', 1.0, 'Multiplier for Foundations package'],
      ['professional_multiplier', 1.5, 'Multiplier for Professional package'],
      ['professional_plus_multiplier', 2.0, 'Multiplier for Professional Plus package'],
      ['module_hours_per_truck', 2, 'Additional hours per module per truck']
    ];

    let paramCount = 0;
    parameters.forEach(([name, value, description]) => {
      db.run(
        `INSERT OR IGNORE INTO calculation_parameters (parameterName, parameterValue, description) 
         VALUES (?, ?, ?)`,
        [name, value, description],
        (err) => {
          if (err) {
            console.error('Error inserting parameter:', err);
            reject(err);
            return;
          }
          paramCount++;
          if (paramCount === parameters.length) {
            resolve();
          }
        }
      );
    });
  });
}

/**
 * Get database connection
 */
function getDb() {
  return db;
}

module.exports = {
  initDatabase,
  getDb
};

