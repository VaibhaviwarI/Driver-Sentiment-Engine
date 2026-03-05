// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');
// 
// const dbPath = path.resolve(__dirname, 'sentiment.db');
// 
// const db = new sqlite3.Database(dbPath, (err) => {
//     if (err) {
//         console.error('Error opening database', err.message);
//     } else {
//         console.log('Connected to the SQLite database.');
//         initializeTables();
//     }
// });

// deployment changes: Postgres support for Railway and SQLite fallback
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let pool;
let db;

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

// // Helper to wrap db queries in Promises for modern async/await syntax
// const runQuery = (sql, params = []) => {
//     return new Promise((resolve, reject) => {
//         db.run(sql, params, function (err) {
//             if (err) reject(err);
//             else resolve(this); // 'this' contains lastID and changes
//         });
//     });
// };
// 
// const getQuery = (sql, params = []) => {
//     return new Promise((resolve, reject) => {
//         db.get(sql, params, (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//         });
//     });
// };
// 
// const allQuery = (sql, params = []) => {
//     return new Promise((resolve, reject) => {
//         db.all(sql, params, (err, rows) => {
//             if (err) reject(err);
//             else resolve(rows);
//         });
//     });
// };

// deployment changes: wrapper to support both SQLite and PostgreSQL natively
const runQuery = async (sql, params = []) => {
    if (pool) {
        let idx = 1;
        const pgSql = sql.replace(/\?/g, () => '$' + (idx++));
        const res = await pool.query(pgSql, params);
        return { lastID: res.insertId || 0, changes: res.rowCount };
    } else {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
};

const getQuery = async (sql, params = []) => {
    if (pool) {
        let idx = 1;
        const pgSql = sql.replace(/\?/g, () => '$' + (idx++));
        const res = await pool.query(pgSql, params);
        // Postgres sometimes returns count(*) as string instead of int
        if (res.rows[0] && res.rows[0].count) res.rows[0].count = parseInt(res.rows[0].count, 10);
        return res.rows[0];
    } else {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
};

const allQuery = async (sql, params = []) => {
    if (pool) {
        let idx = 1;
        const pgSql = sql.replace(/\?/g, () => '$' + (idx++));
        const res = await pool.query(pgSql, params);
        return res.rows;
    } else {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

// deployment changes: Postgres initialization functions
async function initializeTablesPg() {
    try {
        await runQuery(`
            CREATE TABLE IF NOT EXISTS drivers (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                region TEXT DEFAULT 'North',
                average_score REAL DEFAULT 0.0,
                feedback_count INTEGER DEFAULT 0
            )
        `);
        await runQuery(`ALTER TABLE drivers ADD COLUMN region TEXT DEFAULT 'North'`).catch(() => { });

        await runQuery(`
            CREATE TABLE IF NOT EXISTS feedbacks (
                id SERIAL PRIMARY KEY,
                driver_id INTEGER NOT NULL REFERENCES drivers (id),
                text TEXT NOT NULL,
                score INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `);
        // ON CONFLICT DO NOTHING handles duplicates instead of INSERT OR IGNORE
        await runQuery(`INSERT INTO config (key, value) VALUES ('alert_threshold', '2.5') ON CONFLICT DO NOTHING`);
        await runQuery(`INSERT INTO config (key, value) VALUES ('feature_driver', 'true') ON CONFLICT DO NOTHING`);
        await runQuery(`INSERT INTO config (key, value) VALUES ('feature_trip', 'true') ON CONFLICT DO NOTHING`);
        await runQuery(`INSERT INTO config (key, value) VALUES ('feature_app', 'true') ON CONFLICT DO NOTHING`);
        await runQuery(`INSERT INTO config (key, value) VALUES ('feature_marshal', 'true') ON CONFLICT DO NOTHING`);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS jobs_queue (
                id SERIAL PRIMARY KEY,
                payload TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS alerts (
                id SERIAL PRIMARY KEY,
                driver_id INTEGER NOT NULL REFERENCES drivers (id),
                reason TEXT NOT NULL,
                status TEXT DEFAULT 'Open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await runQuery(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                action TEXT NOT NULL,
                details TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('PostgreSQL database tables initialized.');
    } catch (err) {
        console.error('Error initializing PostgreSQL tables:', err);
    }
}


// Initialize DB connection after all functions are defined to avoid Temporal Dead Zone (hoisting) issues
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    console.log('Connected to PostgreSQL database (Railway).');

    // Call the initializer async, gracefully catch any massive failures
    initializeTablesPg().catch(err => {
        console.error("Critical Failure in PostgreSQL Initialization:", err);
    });
} else {
    const dbPath = path.resolve(__dirname, 'sentiment.db');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening SQLite database', err.message);
        } else {
            console.log('Connected to the SQLite database.');
            initializeTables();
        }
    });
}

module.exports = {
    db,
    runQuery,
    getQuery,
    allQuery
};
