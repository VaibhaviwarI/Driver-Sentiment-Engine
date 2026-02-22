const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // HTTP request logger
const { getQuery, allQuery, runQuery } = require('./database');
const { pushToQueue, getQueueStats } = require('./queue');
const cache = require('./cache');

const app = express();
app.use(cors());
app.use(express.json());

// Monitoring / Logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

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

const { authenticateToken, generateToken } = require('./auth');

// ==========================================
// ADMIN AUTH ENDPOINTS
// ==========================================

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // Hardcoded admin for MVP purposes
    if (username === 'admin' && password === 'admin123') {
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
app.use('/api/admin', authenticateToken);

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
        cache.invalidate('config_ui'); // invalidate cache globally
        res.json({ message: "Config updated globally." });
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
