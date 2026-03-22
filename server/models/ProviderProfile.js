const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    profileImage: String,
    businessName: String,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: Date,
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true,
            index: '2dsphere' // Critical for geospatial queries
        },
        formattedAddress: String
    },
    address: String,
    city: String,
    state: String,
    pincode: String,
    serviceCategories: [String],
    servicesOffered: [{
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ServiceCategory'
        },
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service'
        },
        hourlyRate: Number,
        fixedRate: Number,
        pricingType: {
            type: String,
            enum: ['hourly', 'fixed'],
            default: 'fixed'
        }
    }],
    experienceYears: {
        type: Number,
        required: true
    },
    bio: String,
    serviceRadiusKm: {
        type: Number,
        default: 50
    },
    availability: {
        type: Boolean,
        default: true
    },
    maxActiveJobs: {
        type: Number,
        default: 3
    },
    currentActiveJobs: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    },
    reviewsCount: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    documents: [{
        type: { type: String, required: true },
        url: { type: String, required: true },
        verified: { type: Boolean, default: false }
    }],
    licenseNumber: String,
    insuranceDetails: String,
    certifications: [String],
    languages: [String],
    businessHours: String,
    phone: String,
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    }
});

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
