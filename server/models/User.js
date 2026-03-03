const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    role: {
        type: String,
        enum: ['customer', 'provider', 'admin', 'worker'],
        default: 'customer'
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // New Fields
    walletBalance: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    addresses: [{
        label: String, // e.g., "Home", "Work"
        street: String,
        city: String,
        state: String,
        zip: String,
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: [Number] // [lng, lat]
        }
    }],
    phone: String,
    profileImage: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: String,
    city: String,
    state: String,
    skills: {
        type: [String],
        default: []
    },
    experienceYears: {
        type: Number,
        default: 0
    },
    serviceCategory: {
        type: String
    },
    availability: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
