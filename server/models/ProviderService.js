const mongoose = require('mongoose');

const providerServiceSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProviderProfile',
        required: true,
        index: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
        index: true
    },
    providerPrice: {
        type: Number,
        required: true,
        min: 0
    },
    pricingType: {
        type: String,
        enum: ['fixed', 'hourly'],
        default: 'fixed'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

providerServiceSchema.index({ provider: 1, service: 1 }, { unique: true });

providerServiceSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ProviderService', providerServiceSchema);
