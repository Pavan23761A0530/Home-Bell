const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Helper
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '12h' // Admin sessions might need shorter/different expiry, but standardizing for now
    });
};

// @desc    Admin Login
// @route   POST /api/admin/auth/login
// @access  Public
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    try {
        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            // Generic message for security
            return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied. Not an authorized administrator.' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
        }

        // Send Token
        const token = generateToken(user._id);
        const options = {
            expires: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
            httpOnly: true
        };

        res.status(200).cookie('token', token, options).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
