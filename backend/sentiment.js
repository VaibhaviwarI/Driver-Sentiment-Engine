/**
 * Simple Rule-Based Sentiment Analyzer
 * 
 * In a real production system (and in Java), this would implement an interface
 * (e.g., ISentimentAnalyzer) so that you could easily swap it out for an ML-based
 * approach or an external API like AWS Comprehend or Google Cloud NLP without
 * changing the rest of the application code.
 */

// Basic dictionary of positive and negative keywords/emojis
const POSITIVE_WORDS = ['great', 'good', 'excellent', 'safe', 'awesome', 'kind', 'fast', 'smooth', 'perfect', '👍', '😊', 'best'];
const NEGATIVE_WORDS = ['bad', 'unsafe', 'terrible', 'rude', 'slow', 'scary', 'worst', 'angry', 'late', 'reckless', '👎', '😡'];

/**
 * Analyzes text and returns a score from 1 (very negative) to 5 (very positive).
 * Neutral is 3.
 * 
 * @param {string} text - The rider's feedback text
 * @returns {number} Score from 1 to 5
 */
function analyzeSentiment(text) {
    if (!text || text.trim() === '') {
        return 3; // Neutral by default
    }

    const lowerText = text.toLowerCase();

    let positiveCount = 0;
    let negativeCount = 0;

    // Count positive keywords
    for (const word of POSITIVE_WORDS) {
        if (lowerText.includes(word)) {
            positiveCount++;
        }
    }

    // Count negative keywords
    for (const word of NEGATIVE_WORDS) {
        if (lowerText.includes(word)) {
            negativeCount++;
        }
    }

    if (positiveCount > negativeCount) {
        // Base positive is 4. Make it a 5 if multiple positive words found
        return positiveCount >= 2 ? 5 : 4;
    } else if (negativeCount > positiveCount) {
        // Base negative is 2. Make it a 1 if multiple negative words found
        return negativeCount >= 2 ? 1 : 2;
    }

    // Neutral fallback
    return 3;
}

module.exports = {
    analyzeSentiment
};
