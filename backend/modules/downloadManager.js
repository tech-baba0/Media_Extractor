const https = require('https');
const http = require('http');
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const ffmpegStatic = require('ffmpeg-static');

class DownloadManager {
    /**
     * Streams a file from a remote URL to the express response.
     * @param {string} url - The remote file URL.
     * @param {string} formatId - The optional format_id from yt-dlp.
     * @param {import('express').Response} res - The Express response object.
     */
    async streamFile(url, formatId, res) {
        if (formatId) {
            return new Promise((resolve, reject) => {
                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Disposition', `attachment; filename="downloaded_video.mp4"`);

                const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
                const baseOptions = {};
                if (fs.existsSync(cookiesPath)) {
                    baseOptions.cookies = cookiesPath;
                }

                // If the format requires merging video and audio, yt-dlp cannot output to stdout
                if (formatId.includes('+')) {
                    const tempFile = path.join(os.tmpdir(), `${uuidv4()}.mp4`);
                    console.log(`Downloading and merging to temp file: ${tempFile}`);

                    const subprocess = youtubedl.exec(url, {
                        ...baseOptions,
                        f: formatId,
                        o: tempFile,
                        mergeOutputFormat: 'mp4',
                        ffmpegLocation: ffmpegStatic
                    });

                    // Must catch the promise to prevent Node crashes
                    subprocess.catch((err) => {
                        console.error('yt-dlp process error:', err.message);
                        if (!res.headersSent) res.status(500).end('Streaming error');
                        reject(err);
                    });

                    subprocess.on('close', (code) => {
                        if (code !== 0) {
                            return; // Error already handled by catch()
                        }

                        // Stream the file to the user
                        const readStream = fs.createReadStream(tempFile);
                        readStream.pipe(res);

                        readStream.on('end', () => {
                            fs.unlink(tempFile, (err) => {
                                if (err) console.error('Failed to delete temp file:', err);
                            });
                            resolve();
                        });

                        readStream.on('error', (err) => {
                            console.error('Error reading temp file:', err);
                            fs.unlink(tempFile, () => {});
                            reject(err);
                        });
                    });
                } else {
                    // Single format, can stream directly to stdout
                    try {
                        const subprocess = youtubedl.exec(url, {
                            ...baseOptions,
                            f: formatId,
                            o: '-' // output to stdout
                        });
                        
                        subprocess.catch((err) => {
                            console.error('yt-dlp stream error:', err.message);
                            if (!res.headersSent) res.status(500).end('Streaming error');
                            reject(err);
                        });
                        
                        subprocess.stdout.pipe(res);
                        
                        subprocess.on('close', () => resolve());
                    } catch (err) {
                        console.error('Failed to initiate yt-dlp stream:', err);
                        if (!res.headersSent) res.status(500).json({ error: 'Failed to initiate download stream' });
                        reject(err);
                    }
                }
            });
        }

        // Fallback for direct URLs
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            
            client.get(url, (remoteRes) => {
                if (remoteRes.statusCode >= 300 && remoteRes.statusCode < 400 && remoteRes.headers.location) {
                    return this.streamFile(remoteRes.headers.location, null, res).then(resolve).catch(reject);
                }

                if (remoteRes.statusCode !== 200) {
                    reject(new Error(`Failed to fetch video, status code: ${remoteRes.statusCode}`));
                    return;
                }

                const contentType = remoteRes.headers['content-type'] || 'application/octet-stream';
                const contentLength = remoteRes.headers['content-length'];

                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="downloaded_video.mp4"`);
                
                if (contentLength && parseInt(contentLength, 10) > 0) {
                    res.setHeader('Content-Length', contentLength);
                }

                remoteRes.pipe(res);

                remoteRes.on('end', () => resolve());
                remoteRes.on('error', (err) => {
                    console.error('Remote stream error:', err);
                    if (!res.headersSent) res.status(500).end('Streaming error');
                    else res.end();
                    reject(err);
                });
            }).on('error', (err) => {
                console.error('Failed to initiate download request:', err);
                if (!res.headersSent) res.status(500).json({ error: 'Failed to initiate download stream' });
                reject(err);
            });
        });
    }
}

module.exports = new DownloadManager();
