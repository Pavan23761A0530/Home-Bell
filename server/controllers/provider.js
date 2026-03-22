const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');

// @desc    Get all providers
// @route   GET /api/providers
// @access  Public
exports.getProviders = async (req, res) => {
    try {
        const providers = await ProviderProfile.find().populate('user', 'name email');
        res.status(200).json({ success: true, count: providers.length, data: providers });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get providers within radius (50km default)
// @route   GET /api/providers/radius/:lat/:lng
// @access  Private (Customer)
exports.getProvidersInRadius = async (req, res) => {
    const { lat, lng } = req.params;
    const radius = 50 / 6378; // 50km / Earth radius in km

    try {
        const providers = await ProviderProfile.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[lng, lat], radius]
                }
            },
            availability: true,
            isVerified: true
            // TODO: Add filter for maxActiveJobs compliance
        }).populate('user', 'name');

        // Sort by simple criteria if needed, or rely on client to sort
        // For more advanced sorting (distance, rating), we might need aggregation pipeline

        if (providers.length === 0) {
            return res.status(200).json({ success: true, data: [], message: 'No providers available in your area' });
        }

        res.status(200).json({ success: true, count: providers.length, data: providers });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Create or Update Provider Profile
// @route   POST /api/providers
// @access  Private (Provider)
exports.updateProfile = async (req, res) => {
    try {
        const fieldsToUpdate = {
            user: req.user.id,
            ...req.body
        };

        // If location is provided as lat/lng, format it to GeoJSON
        if (req.body.lat && req.body.lng) {
            fieldsToUpdate.location = {
                type: 'Point',
                coordinates: [req.body.lng, req.body.lat],
                formattedAddress: req.body.address
            };
        }

        let profile = await ProviderProfile.findOne({ user: req.user.id });

        if (profile) {
            // Update
            profile = await ProviderProfile.findOneAndUpdate(
                { user: req.user.id },
                { $set: fieldsToUpdate },
                { new: true, runValidators: true }
            );
        } else {
            // Create
            profile = await ProviderProfile.create(fieldsToUpdate);
        }

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
