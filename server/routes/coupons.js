const express = require('express');
const router = express.Router();
const { applyCoupon, getAvailableCoupons } = require('../controllers/coupons');
const { protect } = require('../middleware/auth');

// @route   POST /api/coupons/apply
// @desc    Validate and calculate coupon discount
// @access  Private
router.post('/apply', protect, applyCoupon);

// @route   GET /api/coupons
// @desc    Get all available active coupons
// @access  Private
router.get('/', protect, getAvailableCoupons);

module.exports = router;
