const GenericExtractor = require('./extractors/GenericExtractor');
const UniversalExtractor = require('./extractors/UniversalExtractor');

class UrlRouter {
    constructor() {
        this.extractors = {
            'generic': new GenericExtractor(),
            'universal': new UniversalExtractor()
        };
    }

    getExtractor(url) {
        try {
            const parsedUrl = new URL(url);
            const pathname = parsedUrl.pathname.toLowerCase();
            
            // If it's explicitly a direct file ending in .mp4 or .webm, use generic
            if (pathname.endsWith('.mp4') || pathname.endsWith('.webm') || pathname.endsWith('.m3u8')) {
                return this.extractors['generic'];
            }
            
            // For YouTube, Facebook, Instagram, Twitter, etc., use the universal extractor
            return this.extractors['universal'];
            
        } catch (e) {
            // Invalid URL fallback
        }
        
        return this.extractors['generic'];
    }
}

module.exports = new UrlRouter();
