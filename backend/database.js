const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'sentiment.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Driver Table
        db.run(`
            CREATE TABLE IF NOT EXISTS drivers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                region TEXT DEFAULT 'North',
                average_score REAL DEFAULT 0.0,
                feedback_count INTEGER DEFAULT 0
            )
        `, (err) => {
            // Fallback to alter table for existing databases without breaking
            if (!err) {
                db.run(`ALTER TABLE drivers ADD COLUMN region TEXT DEFAULT 'North'`, (alterErr) => {
                    // Ignore error if column already exists
                });
            }
        });

        // Feedback Table
        db.run(`
            CREATE TABLE IF NOT EXISTS feedbacks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                score INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (driver_id) REFERENCES drivers (id)
            )
        `);

        // Config Table (for feature flags and thresholds)
        db.run(`
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `, (err) => {
            if (!err) {
                // Insert default threshold if not exists
                db.run(`INSERT OR IGNORE INTO config (key, value) VALUES ('alert_threshold', '2.5')`);
                db.run(`INSERT OR IGNORE INTO config (key, value) VALUES ('feature_driver', 'true')`);
                db.run(`INSERT OR IGNORE INTO config (key, value) VALUES ('feature_trip', 'true')`);
                db.run(`INSERT OR IGNORE INTO config (key, value) VALUES ('feature_app', 'true')`);
                db.run(`INSERT OR IGNORE INTO config (key, value) VALUES ('feature_marshal', 'true')`);
            }
        });

        // Job Queue Table (Fault Tolerance)
        db.run(`
            CREATE TABLE IF NOT EXISTS jobs_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Alerts Table
        db.run(`
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                driver_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                status TEXT DEFAULT 'Open',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (driver_id) REFERENCES drivers (id)
            )
        `);

        // Audit Logs Table
        db.run(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                details TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database tables initialized.');
    });
}

// Helper to wrap db queries in Promises for modern async/await syntax
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this); // 'this' contains lastID and changes
        });
    });
};

const getQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

const allQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

module.exports = {
    db,
    runQuery,
    getQuery,
    allQuery
};
