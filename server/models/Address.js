const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: [true, 'Please add a full name']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    street: {
        type: String,
        required: [true, 'Please add a street address']
    },
    city: {
        type: String,
        required: [true, 'Please add a city']
    },
    state: {
        type: String,
        required: [true, 'Please add a state']
    },
    pincode: {
        type: String,
        required: [true, 'Please add a pincode']
    },
    landmark: {
        type: String
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'addresses'
});

module.exports = mongoose.model('Address', addressSchema);
