const express = require('express');
const { getServiceRecommendation, chatWithAI, summarizeReviews, getAiHealth } = require('../controllers/ai');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

const buckets = new Map();
const limitPerMinute = 20;
const rateLimit = (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const entry = buckets.get(key) || { count: 0, windowStart: now };
    if (now - entry.windowStart >= 60000) {
        entry.count = 0;
        entry.windowStart = now;
    }
    entry.count += 1;
    buckets.set(key, entry);
    if (entry.count > limitPerMinute) {
        return res.status(429).json({
            success: false,
            error: 'Too many requests'
        });
    }
    next();
};

router.route('/service-recommendation').post(getServiceRecommendation);

router.route('/chat').post(rateLimit, chatWithAI);

router.route('/review-summary').post(summarizeReviews);

router.route('/health').get(getAiHealth);

module.exports = router;
