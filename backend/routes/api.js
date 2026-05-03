const express = require('express');
const urlRouter = require('../modules/urlRouter');
const downloadManager = require('../modules/downloadManager');

const router = express.Router();

router.post('/analyze', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const extractor = urlRouter.getExtractor(url);
        const result = await extractor.analyze(url);
        res.json(result);
    } catch (error) {
        console.error('Error analyzing URL:', error);
        res.status(500).json({ error: error.message || 'Failed to analyze URL' });
    }
});

router.get('/download', async (req, res) => {
    const { url, format_id, startTime, endTime, isAudio } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        await downloadManager.streamFile(url, format_id, res, { 
            startTime, 
            endTime, 
            isAudio: isAudio === 'true' 
        });
    } catch (error) {
        console.error('Error downloading file:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download file' });
        }
    }
});

module.exports = router;
