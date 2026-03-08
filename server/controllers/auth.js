const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendOTP } = require('../services/sendOTP');
const { sendEmail } = require('../services/emailService');

// Generate JWT Helper
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateEmailToken = (user) => {
    return jwt.sign({ id: user._id.toString(), email: user.email, type: 'verify' }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Deprecated OtpCode flow retained for backward compatibility; using User fields for OTP

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide name, email and password' 
            });
        }

        // Validate and normalize role
        if (role === 'admin') {
            return res.status(403).json({ success: false, error: 'Admin signup not allowed' });
        }
        if (role === 'worker') {
            return res.status(403).json({ success: false, error: 'Worker signup not allowed' });
        }

        let userRole = 'customer';
        if (role === 'provider') {
            userRole = 'provider';
        }

        const user = await User.create({
            name,
            email,
            password,
            role: userRole
        });

        // Create Provider Profile if role is provider
        if (userRole === 'provider') {
            await ProviderProfile.create({
                user: user._id,
                experienceYears: 0, // Default
                location: {
                    type: 'Point',
                    coordinates: [0, 0], // Default, to be updated
                    formattedAddress: 'Not Set'
                },
                servicesOffered: [], // Initialize empty array
                bio: '' // Initialize with empty bio
            });
        }

        console.log('[Register] Incoming email from body:', email);
        const otpCode = generateOtp();
        user.isVerified = false;
        user.otp = otpCode;
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();

        const verifyToken = generateEmailToken(user);
        const backendVerifyUrl = `${process.env.CLIENT_URL.replace(/\/$/, '')}/api/auth/verify-email?token=${encodeURIComponent(verifyToken)}&email=${encodeURIComponent(user.email)}`;
        const html = `<div>Welcome to LocalServe.<br/>Please verify your email by clicking <a href="${backendVerifyUrl}">this link</a>.<br/>This link expires in 24 hours.</div>`;
        const text = `Verify your email: ${backendVerifyUrl}`;
        // Fire-and-forget email sends to avoid request buffering
        Promise.resolve()
            .then(() => sendEmail(user.email, 'Verify your LocalServe account', text, html))
            .then((res) => {
                if (!res?.success) console.log('[Register] Email send failed', res?.error);
            })
            .catch((err) => console.log('[Register] Email send error', err?.message || err));

        console.log('[Register] Sending OTP to user email:', user.email, 'SMTP sender:', process.env.EMAIL_USER);
        if (process.env.NODE_ENV === 'production') {
            const sendResult = await sendOTP(user.email, otpCode);
            if (!sendResult?.success) {
                console.error('[Register] OTP send failed (production):', sendResult?.error);
                return res.status(500).json({ success: false, error: 'Failed to send OTP email. Please try again later.' });
            }
        } else {
            Promise.resolve()
                .then(() => sendOTP(user.email, otpCode))
                .then((res) => {
                    if (!res?.success) console.error('[Register] OTP send failed', res?.error);
                })
                .catch((err) => console.error('[Register] OTP send error', err?.message || err));
        }
        const payload = {
            success: true,
            otpRequired: true,
            email: user.email,
            message: 'OTP sent. Please verify your email to complete signup.'
        };
        return res.status(200).json(payload);
    } catch (err) {
        console.error('Registration error:', err);
        // Handle specific validation errors
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email already exists' 
            });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ success: false, error: 'Please verify your email via OTP before login' });
        }
        return sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Verify OTP and complete auth
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ success: false, error: 'Email and code are required' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ success: false, error: 'No OTP found. Please request a new one.' });
        }
        if (user.otpExpiry.getTime() < Date.now()) {
            return res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.' });
        }
        const inputCode = code.toString();
        if (user.otp.toString() !== inputCode) {
            return res.status(400).json({ success: false, error: 'Invalid OTP. Please try again.' });
        }
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        return res.status(200).json({ success: true, message: 'Verification successful. Please log in.' });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Resend OTP with cooldown
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
    }
    try {
        console.log('[ResendOTP] Email from request body:', email);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        console.log('[ResendOTP] Resolved user email for resend:', user.email);
        const code = generateOtp();
        user.otp = code;
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await user.save();
        const sendResult = await sendOTP(user.email, code);
        if (!sendResult?.success) {
            return res.status(500).json({ success: false, error: sendResult?.error || 'Failed to send OTP email' });
        }
        const payload = { success: true, message: 'OTP resent to your email' };
        if (process.env.NODE_ENV !== 'production') {
            payload.devOtp = code;
        }
        return res.status(200).json(payload);
    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
};
// @desc    Verify email via link
// @route   GET /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const { token, email } = req.query;
        if (!token || !email) {
            return res.status(400).json({ success: false, error: 'Missing token or email' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'verify' || decoded.email !== email) {
            return res.status(400).json({ success: false, error: 'Invalid token' });
        }
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        user.isVerified = true;
        await user.save();
        return res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (err) {
        console.log('[VerifyEmail] Error', err?.message || err);
        return res.status(400).json({ success: false, error: err?.message || 'Verification failed' });
    }
};
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
    res
        .clearCookie('token')
        .status(200)
        .json({ success: true, message: 'Logged out successfully' });
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
};
