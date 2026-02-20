const { db, runQuery, getQuery } = require('./database');
const { analyzeSentiment } = require('./sentiment');
const { calculateEMA } = require('./ema');
const cache = require('./cache');

/**
 * In a real-world system or a Java Spring architecture, 
 * this array would be a Message Broker (like Apache Kafka or RabbitMQ)
 * acting as a buffer to not overwhelm the database during high traffic.
 */
const feedbackQueue = [];

/**
 * Distributed Lock Simulator. 
 * Prevents spamming alerts for the same driver.
 * In a production architecture, this would be a Redis Key with a TTL (Time To Live).
 */
const alertLocks = new Map();
const LOCK_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour cooldown

// Add an item to the queue (to be called by Express API)
function pushToQueue(feedbackData) {
    feedbackQueue.push(feedbackData);
}

// Background Worker Processor
async function processQueue() {
    if (feedbackQueue.length === 0) {
        // If queue is empty, wait a bit and check again
        setTimeout(processQueue, 500);
        return;
    }

    // Dequeue the first item
    const data = feedbackQueue.shift();

    try {
        await processFeedbackItem(data);
    } catch (err) {
        console.error("Error processing feedback:", err);
        // Depending on requirements, we could push it back to the queue (retry logic)
    }

    // Call itself recursively immediately to process the next item
    setImmediate(processQueue);
}

// Core DB Logic for a single feedback item
async function processFeedbackItem(data) {
    const { driverId, text } = data;

    // 1. Calculate the score from the text
    const score = analyzeSentiment(text);

    // 2. Wrap all SQL operations in a Transaction
    await runQuery('BEGIN TRANSACTION');

    try {
        // 3. Get current driver state
        const driver = await getQuery('SELECT * FROM drivers WHERE id = ?', [driverId]);
        if (!driver) {
            throw new Error(`Driver not found: ${driverId}`);
        }

        const currentEma = driver.average_score;
        const currentCount = driver.feedback_count;

        // 4. Calculate new moving average (O(1) approach)
        const newEma = calculateEMA(score, currentEma, currentCount);
        const newCount = currentCount + 1;

        // 5. Update Driver Table
        await runQuery(
            'UPDATE drivers SET average_score = ?, feedback_count = ? WHERE id = ?',
            [newEma, newCount, driverId]
        );

        // 6. Insert into Feedbacks Table
        await runQuery(
            'INSERT INTO feedbacks (driver_id, text, score) VALUES (?, ?, ?)',
            [driverId, text, score]
        );

        // 7. Check for Alerts
        await checkAndTriggerAlert(driverId, driver.name, newEma);

        // 8. Commit
        await runQuery('COMMIT');

        // 9. Invalidate Cache so the next dashboard fetch gets the new score
        cache.invalidate('admin_drivers');

        console.log(`[Worker] Processed feedback for driver ${driverId}. Old avg: ${currentEma}, New avg: ${newEma}`);

    } catch (err) {
        await runQuery('ROLLBACK');
        throw err;
    }
}

async function checkAndTriggerAlert(driverId, driverName, newEma) {
    // Determine configured threshold
    const configRow = await getQuery("SELECT value FROM config WHERE key = 'alert_threshold'");
    const threshold = configRow ? parseFloat(configRow.value) : 2.5;

    // Check if score is dangerous
    if (newEma < threshold) {
        const lastAlertTime = alertLocks.get(driverId);
        const now = Date.now();

        // If no lock exists, or lock has expired (past 1 hour)
        if (!lastAlertTime || (now - lastAlertTime > LOCK_COOLDOWN_MS)) {
            // FIRE ALERT
            // In a real app, send an Email, Slack message, or WebSocket payload here
            console.warn(`[🚨 ALERT TRIGGERED] Driver ${driverName} (ID: ${driverId}) has dropped below threshold! Current Avg: ${newEma}`);

            // Set the lock so we don't alert again for an hour
            alertLocks.set(driverId, now);
        } else {
            // Lock exists. We suppressed the spam.
            console.log(`[Info] Driver ${driverId} score is low, but an alert was already sent recently. Suppressing duplicate alert.`);
        }
    }
}

// Start processing immediately
processQueue();

module.exports = {
    pushToQueue,
    getQueueStats: () => feedbackQueue.length
};
