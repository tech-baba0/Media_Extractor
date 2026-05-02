const BaseExtractor = require('./BaseExtractor');
const youtubedl = require('youtube-dl-exec');

class UniversalExtractor extends BaseExtractor {
    async analyze(url) {
        try {
            const info = await youtubedl(url, {
                dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                addHeader: [
                    'referer:youtube.com',
                    'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
                ]
            });
            
            const formatSize = (bytes) => {
                if (!bytes) return 'Unknown size';
                const mb = bytes / (1024 * 1024);
                return `${mb.toFixed(2)} MB`;
            };

            // Filter out audio-only formats
            const videoFormats = info.formats.filter(f => f.vcodec !== 'none' && f.ext === 'mp4');
            
            // Map to our generic format
            const mappedFormats = videoFormats.map(format => {
                const height = format.height || format.format_note;
                const sizeBytes = format.filesize || format.filesize_approx || 0;
                
                // If it lacks audio, merge with best audio, fallback to best overall if audio is missing
                const finalFormatId = format.acodec === 'none'
                    ? `${format.format_id}+bestaudio/best` 
                    : format.format_id;
                
                return {
                    format_id: finalFormatId,
                    quality: `${height}p`,
                    url: format.url, // Original media URL
                    type: 'mp4', // Merged results are mp4
                    size: formatSize(sizeBytes),
                    _height: parseInt(height) || 0
                };
            });

            // Sort by quality (highest first)
            const sortedFormats = mappedFormats.sort((a, b) => b._height - a._height);

            // Remove duplicates by quality
            const uniqueFormats = [];
            const seenQualities = new Set();
            for (const f of sortedFormats) {
                if (!seenQualities.has(f.quality)) {
                    seenQualities.add(f.quality);
                    // Remove internal sorting helper
                    delete f._height;
                    uniqueFormats.push(f);
                }
            }

            return {
                title: info.title || 'Video',
                thumbnail: info.thumbnail || '',
                formats: uniqueFormats.length > 0 ? uniqueFormats : [
                    { quality: 'Unknown', url: url, type: 'mp4', size: 'Unknown size' }
                ]
            };
        } catch (error) {
            console.error('Universal Extractor Error:', error);
            throw new Error('Failed to analyze URL: ' + error.message);
        }
    }
}

module.exports = UniversalExtractor;
