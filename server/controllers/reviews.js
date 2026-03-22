const Review = require('../models/Review');
const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');

// @desc    Add Review
// @route   POST /api/reviews
// @access  Private (Customer)
exports.addReview = async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.customer.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        if (booking.status !== 'completed') {
            return res.status(400).json({ success: false, error: 'Service must be completed to review' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({ booking: bookingId });
        if (existingReview) {
            return res.status(400).json({ success: false, error: 'Review already exists for this booking' });
        }

        const review = await Review.create({
            booking: bookingId,
            customer: req.user.id,
            provider: booking.provider,
            rating,
            comment
        });

        // Update Provider Average Rating & Reviews Count
        const profile = await ProviderProfile.findById(booking.provider);
        const reviews = await Review.find({ provider: booking.provider });

        profile.reviewsCount = reviews.length;
        profile.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

        await profile.save();

        res.status(201).json({ success: true, data: review });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get Reviews for a Provider (accepts provider user id or provider profile id)
// @route   GET /api/reviews/provider/:providerId
// @access  Public
exports.getProviderReviews = async (req, res) => {
    try {
        const ProviderProfile = require('../models/ProviderProfile');
        let providerProfileId = req.params.providerId;
        // If providerId is a User id, resolve to profile _id
        try {
            const profile = await ProviderProfile.findOne({ user: providerProfileId }).select('_id');
            if (profile) {
                providerProfileId = profile._id;
            }
        } catch {}
        const reviews = await Review.find({ provider: providerProfileId })
            .populate('customer', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
