/**
 * Abstract Base Class simulating an Interface (ISentimentAnalyzer)
 */
class ISentimentAnalyzer {
    analyze(text) {
        throw new Error("Method 'analyze()' must be implemented.");
    }
}

/**
 * Concrete Implementation of Rule-Based Sentiment Analysis
 */
class RuleBasedSentimentAnalyzer extends ISentimentAnalyzer {
    constructor() {
        super();
        this.POSITIVE_WORDS = ['great', 'good', 'excellent', 'safe', 'awesome', 'kind', 'fast', 'smooth', 'perfect', '👍', '😊', 'best'];
        this.NEGATIVE_WORDS = ['bad', 'unsafe', 'terrible', 'rude', 'slow', 'scary', 'worst', 'angry', 'late', 'reckless', '👎', '😡'];
    }

    /**
     * Analyzes text and returns a score from 1 (very negative) to 5 (very positive).
     * @param {string} text 
     * @returns {number} Score from 1 to 5
     */
    analyze(text) {
        if (!text || text.trim() === '') {
            return 3; // Neutral by default
        }

        const lowerText = text.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;

        for (const word of this.POSITIVE_WORDS) {
            if (lowerText.includes(word)) positiveCount++;
        }

        for (const word of this.NEGATIVE_WORDS) {
            if (lowerText.includes(word)) negativeCount++;
        }

        if (positiveCount > negativeCount) {
            return positiveCount >= 2 ? 5 : 4;
        } else if (negativeCount > positiveCount) {
            return negativeCount >= 2 ? 1 : 2;
        }

        return 3; // Neutral fallback
    }
}

// Export a singleton instance (Dependency Injection pattern can be used here later)
const analyzerInstance = new RuleBasedSentimentAnalyzer();

module.exports = {
    ISentimentAnalyzer,
    RuleBasedSentimentAnalyzer,
    analyzeSentiment: (text) => analyzerInstance.analyze(text)
};
