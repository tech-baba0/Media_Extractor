class BaseExtractor {
    /**
     * Analyzes a URL and returns metadata and available formats.
     * @param {string} url - The video URL to analyze.
     * @returns {Promise<{title: string, thumbnail: string, formats: Array<{quality: string, url: string, type: string, size?: number}>}>}
     */
    async analyze(url) {
        throw new Error('analyze() method must be implemented by subclass');
    }
}

module.exports = BaseExtractor;
