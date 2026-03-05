const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // HTTP request logger
const { getQuery, allQuery, runQuery } = require('./database');
const { pushToQueue, getQueueStats } = require('./queue');
const cache = require('./cache');

const app = express();
app.use(cors());
app.use(express.json());

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// ==========================================
// SYSTEM HEALTH ENDPOINT
// ==========================================
app.get('/health', async (req, res) => {
    try {
        const queueRow = await getQuery(`SELECT COUNT(*) as count FROM jobs_queue WHERE status = 'pending'`);
        const qLen = queueRow ? queueRow.count : 0;
        const uptime = process.uptime();
        const mem = process.memoryUsage();

        res.status(200).json({
            status: 'ok',
            database: 'connected',
            queueLength: qLen,
            uptimeSeconds: Math.floor(uptime),
            memoryUsageMB: Math.round(mem.rss / 1024 / 1024)
        });
    } catch (err) {
        res.status(503).json({ status: 'error', details: err.message });
    }
});

// ==========================================
// RIDER APP ENDPOINTS
// ==========================================

/**
 * Endpoint to submit feedback.
 * Notice we respond with "202 Accepted" immediately to not block the client,
 * while the heavy DB/Analytics work happens in the background Queue worker.
 */
app.post('/api/feedback', (req, res) => {
    const { driverId, text } = req.body;

    if (!driverId || !text) {
        return res.status(400).json({ error: 'driverId and text are required' });
    }

    // Push payload to our simulated Message Broker (Kafka/Redis Queue)
    pushToQueue({ driverId, text });

    res.status(202).json({
        message: 'Feedback received and queued for processing.',
        queuedAt: new Date().toISOString()
    });
});

/**
 * Get active feature flags (to dynamically toggle UI sections on the frontend)
 */
app.get('/api/config/ui', async (req, res) => {
    try {
        const cachedConfig = cache.get('config_ui');
        if (cachedConfig) {
            return res.json(cachedConfig);
        }

        const rows = await allQuery("SELECT * FROM config WHERE key LIKE 'feature_%'");
        const configMap = {};
        rows.forEach(r => configMap[r.key] = r.value === 'true');

        cache.set('config_ui', configMap); // Save to cache
        res.json(configMap);
    } catch (err) {
        res.status(500).json({ error: 'Database error fetching config' });
    }
});

/**
 * Get all drivers (Public endpoint for Rider App form)
 */
app.get('/api/drivers', async (req, res) => {
    try {
        const drivers = await allQuery("SELECT id, name FROM drivers ORDER BY name ASC");
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

const { authenticateToken, generateToken, authorizeRole } = require('./auth');

// ==========================================
// ADMIN AUTH ENDPOINTS
// ==========================================

app.post('/api/admin/login', (req, res) => {
    // const { username, password } = req.body;
    // // Hardcoded admin for MVP purposes
    // if (username === 'admin' && password === 'admin123') {

    // deployment changes: use environment variables for admin credentials on Render
    const { username, password } = req.body;
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    if (username === adminUsername && password === adminPassword) {
        const token = generateToken({ username, role: 'admin' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// ==========================================
// ADMIN DASHBOARD ENDPOINTS
// ==========================================

// Apply JWT authentication to all admin routes below this line
app.use('/api/admin', authenticateToken, authorizeRole(['admin', 'manager']));

/**
 * Get all drivers and their current Average Scores O(1) Fetch
 */
app.get('/api/admin/drivers', async (req, res) => {
    try {
        const cachedDrivers = cache.get('admin_drivers');
        if (cachedDrivers) {
            return res.json(cachedDrivers);
        }

        const drivers = await allQuery("SELECT * FROM drivers ORDER BY average_score ASC");
        cache.set('admin_drivers', drivers);
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * Get a stream of recent feedbacks
 */
app.get('/api/admin/feedbacks', async (req, res) => {
    try {
        const feedbacks = await allQuery(`
            SELECT f.text, f.score, f.created_at, d.name as driver_name 
            FROM feedbacks f 
            JOIN drivers d ON d.id = f.driver_id 
            ORDER BY f.created_at DESC LIMIT 50
        `);
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * Get System Status (Queue Length, Cooldown Thresholds)
 */
app.get('/api/admin/system', async (req, res) => {
    try {
        const thresholdRow = await getQuery("SELECT value FROM config WHERE key = 'alert_threshold'");
        const queueLength = await getQueueStats();
        res.json({
            queueLength: queueLength,
            alertThreshold: thresholdRow ? thresholdRow.value : "2.5"
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

/**
 * Update system configuration (e.g. change alert threshold dynamically)
 */
app.post('/api/admin/config', async (req, res) => {
    const { key, value } = req.body;
    try {
        await runQuery("UPDATE config SET value = ? WHERE key = ?", [String(value), key]);
        await runQuery("INSERT INTO audit_logs (action, details) VALUES (?, ?)", ['CONFIG_UPDATED', `Key: ${key}, New Value: ${value}`]);
        cache.invalidate('config_ui'); // invalidate cache globally
        res.json({ message: "Config updated globally." });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});


// ==========================================
// NEW FEATURE ENDPOINTS
// ==========================================

// 1. Leaderboard (Public/Driver app accessible) top 10 drivers
app.get('/api/leaderboard', async (req, res) => {
    try {
        const drivers = await allQuery("SELECT id, name, average_score, region FROM drivers WHERE average_score > 0 ORDER BY average_score DESC LIMIT 10");
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// 2. Driver dashboard routes (Public/Driver app accessible)
app.get('/api/driver/dashboard/:id', async (req, res) => {
    try {
        const driver = await getQuery("SELECT * FROM drivers WHERE id = ?", [req.params.id]);
        const feedbacks = await allQuery("SELECT * FROM feedbacks WHERE driver_id = ? ORDER BY created_at DESC LIMIT 10", [req.params.id]);
        res.json({ driver, feedbacks });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// 3. Region-based fleet management (Admin only)
app.get('/api/admin/fleet/region/:region', async (req, res) => {
    const { region } = req.params;
    try {
        const drivers = await allQuery("SELECT * FROM drivers WHERE region = ? ORDER BY average_score ASC", [region]);
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// 4. Risk classification system (Admin only)
app.get('/api/admin/drivers/risk', async (req, res) => {
    try {
        const drivers = await allQuery("SELECT id, name, average_score, region FROM drivers WHERE average_score > 0");
        const classified = {
            high: drivers.filter(d => d.average_score > 0 && d.average_score < 2.5),
            medium: drivers.filter(d => d.average_score >= 2.5 && d.average_score <= 3.5),
            low: drivers.filter(d => d.average_score > 3.5)
        };
        res.json(classified);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// 5. Alert management (Admin only)
app.get('/api/admin/alerts', async (req, res) => {
    try {
        const alerts = await allQuery(`
            SELECT a.*, d.name as driver_name 
            FROM alerts a JOIN drivers d ON a.driver_id = d.id 
            WHERE a.status = 'Open' ORDER BY a.created_at DESC
        `);
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/admin/alerts/:id/resolve', async (req, res) => {
    try {
        await runQuery("UPDATE alerts SET status = 'Resolved' WHERE id = ?", [req.params.id]);
        await runQuery("INSERT INTO audit_logs (action, details) VALUES (?, ?)", ['ALERT_RESOLVED', `Resolved alert ID: ${req.params.id}`]);
        res.json({ message: 'Alert resolved' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// 6. Audit Logs System
app.get('/api/admin/audit-logs', async (req, res) => {
    try {
        const logs = await allQuery("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// 7. Deactivate Driver (Mocking Endpoint for Audit demonstrating)
app.post('/api/admin/driver/:id/deactivate', async (req, res) => {
    try {
        // We aren't actually deleting/deactivating internally to keep flow safe, 
        // just demonstrating the enterprise audit log feature.
        await runQuery("INSERT INTO audit_logs (action, details) VALUES (?, ?)", ['DRIVER_DEACTIVATED', `Deactivated driver ID: ${req.params.id}`]);
        res.json({ message: 'Driver deactivated successfully (Mock)' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ==========================================
// GLOBAL ERROR HANDLING
// ==========================================
app.use((err, req, res, next) => {
    console.error(`[Global Error Handler] ${err.stack}`);
    res.status(500).json({ error: 'An unexpected internal server error occurred', details: err.message });
});

// Start Web Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Driver Sentiment Engine Backend running on port ${PORT}`);
});
