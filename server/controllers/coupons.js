const Coupon = require('../models/Coupon');
const User = require('../models/User');

exports.applyCoupon = async (req, res) => {
    try {
        const { code, serviceId, basePrice } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: 'Coupon code is required' });
        }
        if (typeof basePrice !== 'number' || basePrice <= 0) {
            return res.status(400).json({ success: false, error: 'Valid base amount is required' });
        }

        const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ success: false, error: 'Invalid coupon code' });
        }

        // Validity Checks
        if (!coupon.isActive) {
            return res.status(400).json({ success: false, error: 'Coupon is inactive' });
        }
        if (new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ success: false, error: 'Coupon has expired' });
        }
        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, error: 'Coupon usage limit exceeded' });
        }
        if (coupon.minOrderAmount && basePrice < coupon.minOrderAmount) {
            return res.status(400).json({ success: false, error: `Minimum order amount of ₹${coupon.minOrderAmount} required` });
        }
        
        // Applicable Services filter
        if (coupon.applicableServices && coupon.applicableServices.length > 0) {
            if (!serviceId || !coupon.applicableServices.some(s => s.toString() === String(serviceId))) {
                return res.status(400).json({ success: false, error: 'Coupon not applicable to this service' });
            }
        }
        
        // Applicable Users filter
        if (coupon.applicableUsers && coupon.applicableUsers.length > 0) {
            if (!coupon.applicableUsers.some(u => u.toString() === String(req.user.id))) {
                return res.status(400).json({ success: false, error: 'Coupon not applicable to your account' });
            }
        }

        // Prevent Duplicate Usage by Same User
        const user = await User.findById(req.user.id);
        if (user.usedCoupons && user.usedCoupons.some(c => c.toString() === coupon._id.toString())) {
            return res.status(400).json({ success: false, error: 'You have already used this coupon' });
        }

        // Calculate Discount
        let discountAmount = 0;
        
        if (coupon.discountType === 'PERCENT') {
            discountAmount = basePrice * (coupon.discountValue / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else if (coupon.discountType === 'FLAT') {
            discountAmount = coupon.discountValue;
        }

        let finalAmount = basePrice - discountAmount;
        
        // Prevent negative amounts
        if (finalAmount < 0) {
            discountAmount = basePrice;
            finalAmount = 0;
        }

        // Math.round to prevent precision errors
        discountAmount = Math.round(discountAmount * 100) / 100;
        finalAmount = Math.round(finalAmount * 100) / 100;

        res.status(200).json({
            success: true,
            couponId: coupon._id,
            originalAmount: basePrice,
            discountAmount,
            finalAmount,
            message: `Coupon applied successfully! You saved ₹${discountAmount}`
        });

    } catch (err) {
        console.error('Error applying coupon:', err);
        res.status(500).json({ success: false, error: 'Failed to process coupon validation' });
    }
};

exports.getAvailableCoupons = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const usedCouponIds = user.usedCoupons ? user.usedCoupons.map(id => id.toString()) : [];
        
        // Select active, non-expired coupons
        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gt: new Date() },
            $expr: { $lt: ["$usedCount", "$usageLimit"] }
        }).select('-applicableUsers');

        // Filter out those the user has already used or can't use
        const available = coupons.filter(c => {
            if (usedCouponIds.includes(c._id.toString())) return false;
            // if restricted to specific users, check if user is in array (if fetched)
            return true;
        });

        res.status(200).json({ success: true, count: available.length, data: available });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch coupons' });
    }
};
