const express = require('express');
const { addReview, getProviderReviews } = require('../controllers/reviews');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .post(protect, authorize('customer'), addReview);

router.route('/provider/:providerId')
    .get(protect, getProviderReviews);

module.exports = router;
