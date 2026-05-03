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
    async streamFile(url, formatId, res, requestOptions = {}) {
        if (formatId) {
            return new Promise((resolve, reject) => {
                const { startTime, endTime, isAudio } = requestOptions;
                const ext = isAudio ? 'mp3' : 'mp4';
                res.setHeader('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');
                res.setHeader('Content-Disposition', `attachment; filename="downloaded_media.${ext}"`);

                const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
                const baseOptions = {};
                if (fs.existsSync(cookiesPath)) {
                    baseOptions.cookies = cookiesPath;
                }
                
                if (startTime && endTime) {
                    baseOptions.downloadSections = `*${startTime}-${endTime}`;
                }
                
                if (isAudio) {
                    baseOptions.extractAudio = true;
                    baseOptions.audioFormat = 'mp3';
                }

                const needsTempFile = formatId.includes('+') || (startTime && endTime) || isAudio;

                // If the format requires merging video and audio, or if we are trimming, we must output to a temp file
                if (needsTempFile) {
                    const tempFile = path.join(os.tmpdir(), `${uuidv4()}.${ext}`);
                    console.log(`Downloading and processing to temp file: ${tempFile}`);

                    const startDownload = (useCookies) => {
                        const options = {
                            ...baseOptions,
                            f: formatId,
                            o: tempFile,
                            ffmpegLocation: ffmpegStatic
                        };
                        
                        if (formatId.includes('+') && !isAudio) {
                            options.mergeOutputFormat = ext;
                        }

                        if (!useCookies) {
                            delete options.cookies;
                        }

                        const subprocess = youtubedl.exec(url, options);

                        subprocess.catch((err) => {
                            if (useCookies) {
                                console.log('Download failed with cookies, retrying without cookies...');
                                startDownload(false);
                            } else {
                                console.error('yt-dlp process error:', err.message);
                                if (!res.headersSent) res.status(500).end('Streaming error');
                                reject(err);
                            }
                        });

                        subprocess.on('close', (code) => {
                            if (code !== 0) {
                                return; // Error handled by catch
                            }

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
                    };

                    startDownload(!!baseOptions.cookies);

                } else {
                    // Single format, can stream directly to stdout
                    const startStreamDownload = (useCookies) => {
                        const options = {
                            ...baseOptions,
                            f: formatId,
                            o: '-' // output to stdout
                        };
                        
                        if (!useCookies) {
                            delete options.cookies;
                        }

                        try {
                            const subprocess = youtubedl.exec(url, options);
                            
                            subprocess.catch((err) => {
                                if (useCookies) {
                                    console.log('yt-dlp stream failed with cookies, retrying without cookies...');
                                    startStreamDownload(false);
                                } else {
                                    console.error('yt-dlp stream error:', err.message);
                                    if (!res.headersSent) res.status(500).end('Streaming error');
                                    reject(err);
                                }
                            });
                            
                            subprocess.stdout.pipe(res);
                            
                            subprocess.on('close', (code) => {
                                if (code === 0 || !useCookies) resolve();
                            });
                        } catch (err) {
                            if (useCookies) {
                                console.log('Failed to initiate yt-dlp stream with cookies, retrying without...');
                                startStreamDownload(false);
                            } else {
                                console.error('Failed to initiate yt-dlp stream:', err);
                                if (!res.headersSent) res.status(500).json({ error: 'Failed to initiate download stream' });
                                reject(err);
                            }
                        }
                    };

                    startStreamDownload(!!baseOptions.cookies);

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
