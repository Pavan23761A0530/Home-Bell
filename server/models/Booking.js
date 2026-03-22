const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProviderProfile'
    },
    providerService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProviderService'
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: [
            'searching-provider',
            'assigned',
            'accepted',
            'in-progress',
            'completed',
            'cancelled',
            'disputed'
        ],
        default: 'searching-provider'
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        coordinates: {
            type: [Number], // [lng, lat]
            index: '2dsphere'
        }
    },
    phoneNumber: String,
    description: String,
    contract: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GeneratedContract'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    price: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
