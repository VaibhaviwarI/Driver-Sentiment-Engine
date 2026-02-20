/**
 * Calculates the Exponential Moving Average (EMA).
 * This gives more weight to recent feedback and less to older feedback.
 * 
 * Time Complexity: O(1) - It's a simple mathematical formula.
 * Space Complexity: O(1) - We only need the previous average, not the entire history.
 * 
 * @param {number} currentScore - The score of the new feedback (1-5)
 * @param {number} previousEma - The driver's current average score before this feedback
 * @param {number} feedbackCount - The total number of feedback the driver has received so far
 * @returns {number} The new moving average
 */
function calculateEMA(currentScore, previousEma, feedbackCount) {
    if (feedbackCount === 0 || previousEma === null || previousEma === undefined) {
        return currentScore; // First feedback becomes the base average
    }

    // Alpha is the weighing factor. A common approach is 2 / (N + 1).
    // It dictates how quickly the average responds to new data.
    // E.g., if alpha is high, a single 1-star review quickly tanks a 5-star average.
    // For this engine, an alpha of 0.2 means the new score accounts for 20% of the new average, 
    // and the historical average accounts for 80%.
    const alpha = 0.2;

    // EMA = (Score * alpha) + (PreviousEMA * (1 - alpha))
    const newEma = (currentScore * alpha) + (previousEma * (1 - alpha));

    // Return rounded to 2 decimal places to keep the DB clean
    return Math.round(newEma * 100) / 100;
}

module.exports = { calculateEMA };
