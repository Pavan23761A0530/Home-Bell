const Address = require('../models/Address');

// @desc    Add new address
// @route   POST /api/addresses
// @access  Private
exports.addAddress = async (req, res) => {
    try {
        const { fullName, phone, street, city, state, pincode, landmark, isDefault } = req.body;

        // Validation for required fields
        if (!fullName || !phone || !street || !city || !state || !pincode) {
            return res.status(400).json({
                success: false,
                error: 'Please provide all required fields'
            });
        }

        // Phone validation (simple check for digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid 10-digit phone number'
            });
        }

        // Pincode validation (simple check for 6 digits)
        const pincodeRegex = /^\d{6}$/;
        if (!pincodeRegex.test(pincode)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid 6-digit pincode'
            });
        }

        // If isDefault is true, set all other addresses for this user to isDefault: false
        if (isDefault) {
            await Address.updateMany(
                { userId: req.user.id },
                { $set: { isDefault: false } }
            );
        }

        const address = await Address.create({
            userId: req.user.id,
            fullName,
            phone,
            street,
            city,
            state,
            pincode,
            landmark,
            isDefault
        });

        res.status(201).json({
            success: true,
            data: address
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Get all addresses for logged-in user
// @route   GET /api/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: addresses.length,
            data: addresses
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
    try {
        let address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        // Ensure user ownership
        if (address.userId.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to update this address'
            });
        }

        const { fullName, phone, street, city, state, pincode, landmark, isDefault } = req.body;

        // Validation for phone and pincode if provided
        if (phone) {
            const phoneRegex = /^\d{10}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide a valid 10-digit phone number'
                });
            }
        }

        if (pincode) {
            const pincodeRegex = /^\d{6}$/;
            if (!pincodeRegex.test(pincode)) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide a valid 6-digit pincode'
                });
            }
        }

        // If isDefault is being set to true, unset other addresses
        if (isDefault) {
            await Address.updateMany(
                { userId: req.user.id },
                { $set: { isDefault: false } }
            );
        }

        address = await Address.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: address
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }

        // Ensure user ownership
        if (address.userId.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to delete this address'
            });
        }

        await address.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};
