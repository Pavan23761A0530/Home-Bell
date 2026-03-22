const mongoose = require('mongoose');

const generatedContractSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    customerSignature: {
        signed: { type: Boolean, default: false },
        date: Date,
        name: String
    },
    providerSignature: {
        signed: { type: Boolean, default: false },
        date: Date,
        name: String
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'completed', 'terminated'],
        default: 'draft'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GeneratedContract', generatedContractSchema);
