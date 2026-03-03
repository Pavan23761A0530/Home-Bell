const User = require('../models/User');

// @desc    Get user profile (including addresses)
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const {
            name,
            phone,
            dateOfBirth,
            gender,
            address,
            city,
            state,
            skills,
            experienceYears,
            serviceCategory,
            availability
        } = req.body;
        const user = await User.findById(req.user.id);

        if (user) {
            user.name = name ?? user.name;
            user.phone = phone ?? user.phone;
            if (typeof dateOfBirth !== 'undefined') {
                user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
            }
            user.gender = gender ?? user.gender;
            user.address = address ?? user.address;
            user.city = city ?? user.city;
            user.state = state ?? user.state;
            if (typeof skills !== 'undefined') {
                if (Array.isArray(skills)) user.skills = skills;
                else if (typeof skills === 'string' && skills.trim().length > 0) {
                    user.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
                }
            }
            if (typeof experienceYears !== 'undefined') {
                const num = Number(experienceYears);
                if (!Number.isNaN(num) && num >= 0) user.experienceYears = num;
            }
            if (typeof serviceCategory !== 'undefined') {
                user.serviceCategory = serviceCategory;
            }
            if (typeof availability !== 'undefined') {
                user.availability = ['true', '1', true].includes(availability);
            }

            if (req.file) {
                const path = require('path');
                const fs = require('fs');

                const imageUrl = `${req.protocol}://${req.get('host')}/uploads/profile/${req.file.filename}`;

                if (user.profileImage && typeof user.profileImage === 'string') {
                    try {
                        const existing = user.profileImage;
                        const baseUrl = `${req.protocol}://${req.get('host')}`;
                        let relativePath = existing;
                        if (existing.startsWith(baseUrl)) {
                            relativePath = existing.replace(baseUrl, '');
                        }
                        const cleaned = relativePath.replace(/^[\\/]+/, '');
                        const serverPath = path.join(__dirname, '..', cleaned);
                        if (fs.existsSync(serverPath)) {
                            fs.unlinkSync(serverPath);
                        }
                    } catch {}
                }

                user.profileImage = imageUrl;
            }

            const updatedUser = await user.save();
            res.status(200).json({
                success: true,
                data: {
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    phone: updatedUser.phone,
                    profileImage: updatedUser.profileImage,
                    dateOfBirth: updatedUser.dateOfBirth,
                    gender: updatedUser.gender,
                    address: updatedUser.address,
                    city: updatedUser.city,
                    state: updatedUser.state,
                    addresses: updatedUser.addresses
                }
            });
        } else {
            res.status(404).json({ success: false, error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Add Address
// @route   POST /api/users/addresses
// @access  Private (Customer)
exports.addAddress = async (req, res) => {
    try {
        const { label, street, city, state, zip } = req.body;

        const user = await User.findById(req.user.id);

        // Basic Mock Geocoding (Random nearby point for demo if not provided)
        // In real app, call Google Maps API here
        const mockCoordinates = [
            -73.935242 + (Math.random() - 0.5) * 0.01,
            40.730610 + (Math.random() - 0.5) * 0.01
        ];

        const newAddress = {
            label,
            street,
            city,
            state,
            zip,
            coordinates: { type: 'Point', coordinates: mockCoordinates }
        };

        user.addresses.push(newAddress);
        await user.save();

        res.status(201).json({ success: true, data: user.addresses });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete Address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private (Customer)
exports.deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        user.addresses = user.addresses.filter(
            addr => addr._id.toString() !== req.params.addressId
        );

        await user.save();
        res.status(200).json({ success: true, data: user.addresses });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
