const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please add a coupon code'],
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [20, 'Coupon code cannot be more than 20 characters']
    },
    discountType: {
        type: String,
        enum: ['PERCENT', 'FLAT'],
        required: [true, 'Please specify discount type (PERCENT or FLAT)']
    },
    discountValue: {
        type: Number,
        required: [true, 'Please specify discount value'],
        min: [0, 'Discount value cannot be negative']
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: [0, 'Minimum order amount cannot be negative']
    },
    maxDiscount: {
        type: Number,
        // Only applicable to PERCENT discount type, optional for FLAT
    },
    expiryDate: {
        type: Date,
        required: [true, 'Please specify an expiry date']
    },
    usageLimit: {
        type: Number,
        default: 1, // Number of times total this coupon can be used across entire platform
        min: [1, 'Usage limit must be at least 1']
    },
    usedCount: {
        type: Number,
        default: 0
    },
    applicableServices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }],
    applicableUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual field to check if coupon is valid
couponSchema.virtual('isValid').get(function() {
    return this.isActive && this.expiryDate > new Date() && this.usedCount < this.usageLimit;
});

module.exports = mongoose.model('Coupon', couponSchema);
