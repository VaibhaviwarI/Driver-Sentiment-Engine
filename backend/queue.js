const { db, runQuery, getQuery } = require('./database');
const { analyzeSentiment } = require('./sentiment');
const { calculateEMA } = require('./ema');
const cache = require('./cache');

class PersistentQueue {
    constructor() {
        this.alertLocks = new Map();
        this.LOCK_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown
        this.isProcessing = false;

        // Start processing background queue loop
        this.startProcessing();
    }

    /**
     * Enqueue a new feedback job into the database table
     */
    async enqueue(feedbackData) {
        try {
            await runQuery(
                `INSERT INTO jobs_queue (payload, status) VALUES (?, 'pending')`,
                [JSON.stringify(feedbackData)]
            );
            // Trigger processing loop if not currently active
            this.processNext();
        } catch (err) {
            console.error("Error enqueuing job:", err);
            throw err;
        }
    }

    /**
     * Get approximate queue stats
     */
    async getStats() {
        try {
            const row = await getQuery(`SELECT COUNT(*) as count FROM jobs_queue WHERE status = 'pending'`);
            return row ? row.count : 0;
        } catch (err) {
            return 0;
        }
    }

    /**
     * Start continuous background processor polling
     */
    startProcessing() {
        setInterval(() => this.processNext(), 1000);
    }

    /**
     * Process the next available pending job in the DB
     */
    async processNext() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Find oldest pending job
            const job = await getQuery(`
                SELECT * FROM jobs_queue 
                WHERE status = 'pending' 
                ORDER BY created_at ASC LIMIT 1
            `);

            if (job) {
                // Mark as processing
                await runQuery(`UPDATE jobs_queue SET status = 'processing' WHERE id = ?`, [job.id]);

                const data = JSON.parse(job.payload);
                await this.processFeedbackItem(data);

                // Mark as complete or delete
                await runQuery(`DELETE FROM jobs_queue WHERE id = ?`, [job.id]);

                // Continue processing next immediately
                this.isProcessing = false;
                setImmediate(() => this.processNext());
            } else {
                this.isProcessing = false;
            }
        } catch (err) {
            console.error("Queue process error:", err);
            this.isProcessing = false;
        }
    }

    /**
     * Core Transactional Logic
     */
    async processFeedbackItem(data) {
        const { driverId, text } = data;
        const score = analyzeSentiment(text);

        await runQuery('BEGIN TRANSACTION');

        try {
            const driver = await getQuery('SELECT * FROM drivers WHERE id = ?', [driverId]);
            if (!driver) throw new Error(`Driver not found: ${driverId}`);

            const newEma = calculateEMA(score, driver.average_score, driver.feedback_count);
            const newCount = driver.feedback_count + 1;

            await runQuery(
                'UPDATE drivers SET average_score = ?, feedback_count = ? WHERE id = ?',
                [newEma, newCount, driverId]
            );

            await runQuery(
                'INSERT INTO feedbacks (driver_id, text, score) VALUES (?, ?, ?)',
                [driverId, text, score]
            );

            await this.checkAndTriggerAlert(driverId, driver.name, newEma);
            await runQuery('COMMIT');
            cache.invalidate('admin_drivers');

        } catch (err) {
            await runQuery('ROLLBACK');
            throw err;
        }
    }

    /**
     * Alert logic
     */
    async checkAndTriggerAlert(driverId, driverName, newEma) {
        const configRow = await getQuery("SELECT value FROM config WHERE key = 'alert_threshold'");
        const threshold = configRow ? parseFloat(configRow.value) : 2.5;

        if (newEma < threshold) {
            const lastAlertTime = this.alertLocks.get(driverId);
            const now = Date.now();

            if (!lastAlertTime || (now - lastAlertTime > this.LOCK_COOLDOWN_MS)) {
                console.warn(`[🚨 ALERT TRIGGERED] Driver ${driverName} has dropped below threshold! Current Avg: ${newEma}`);
                this.alertLocks.set(driverId, now);
            }
        }
    }
}

// Singleton Instance
const queueInstance = new PersistentQueue();

module.exports = {
    pushToQueue: (data) => queueInstance.enqueue(data),
    getQueueStats: async () => await queueInstance.getStats()
};
