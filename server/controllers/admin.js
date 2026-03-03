const User = require('../models/User');
const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const SystemSetting = require('../models/SystemSetting');
const Service = require('../models/Service');
const ProviderService = require('../models/ProviderService');
const Notification = require('../models/Notification');
const { sendNotification } = require('./notifications');

// @desc    Admin Stats (dedicated)
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getAdminStats = async (req, res) => {
    try {
        const [totalCustomers, totalProviders, totalWorkers, totalBookings, activeBookingsAgg, revenueAgg, totalServices] = await Promise.all([
            User.countDocuments({ role: 'customer' }),
            User.countDocuments({ role: 'provider' }),
            User.countDocuments({ role: 'worker' }),
            Booking.countDocuments(),
            Booking.countDocuments({ status: { $in: ['assigned', 'accepted', 'in-progress'] } }),
            Booking.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$price' } } }
            ]),
            Service.countDocuments()
        ]);

        const revenue = Array.isArray(revenueAgg) && revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        return res.status(200).json({
            success: true,
            data: {
                totalUsers: totalCustomers,
                totalProviders,
                totalWorkers,
                totalBookings,
                activeBookings: activeBookingsAgg,
                totalServices,
                revenue
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getAdminDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProviders = await User.countDocuments({ role: 'provider' });
        const totalBookings = await Booking.countDocuments();
        const activeBookings = await Booking.countDocuments({ status: { $in: ['assigned', 'accepted', 'in-progress'] } });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalProviders,
                totalBookings,
                activeBookings,
                revenue: 5400.00 // Mock
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get System Settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
exports.getSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.find({});
        const settingsMap = {};
        settings.forEach(s => settingsMap[s.key] = s.value);

        const finalSettings = {
            searchRadius: 50,
            maxActiveJobs: 3,
            ...settingsMap
        };

        res.status(200).json({ success: true, data: finalSettings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/admin/bookings
// @access  Private (Admin)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('customer', 'name email')
            .populate({
                path: 'provider',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('service', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Admin Update Booking Status (Force Cancel/Reassign)
// @route   PUT /api/admin/bookings/:id
// @access  Private (Admin)
exports.adminUpdateBooking = async (req, res) => {
    try {
        const { status, providerId } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (status) {
            booking.status = status;
        }

        if (providerId) {
            if (providerId === 'UNASSIGNED') {
                booking.provider = undefined;
                booking.status = 'searching-provider';
            } else {
                booking.provider = providerId;
                booking.status = 'assigned';
            }
        }

        await booking.save();
        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update System Settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
exports.updateSettings = async (req, res) => {
    try {
        const { searchRadius, maxActiveJobs } = req.body;

        if (searchRadius) {
            await SystemSetting.findOneAndUpdate(
                { key: 'searchRadius' },
                { key: 'searchRadius', value: parseInt(searchRadius), description: 'Provider Search Radius (km)', updatedAt: Date.now() },
                { upsert: true, new: true }
            );
        }

        if (maxActiveJobs) {
            await SystemSetting.findOneAndUpdate(
                { key: 'maxActiveJobs' },
                { key: 'maxActiveJobs', value: parseInt(maxActiveJobs), description: 'Max active jobs per provider', updatedAt: Date.now() },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({ success: true, message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    List all providers (admin)
// @route   GET /api/admin/providers
// @access  Private (Admin)
exports.getAllProviders = async (req, res) => {
    try {
        const providers = await ProviderProfile.find()
            .populate('user', 'name email role')
            .populate({ path: 'servicesOffered.service', select: 'name' })
            .populate({ path: 'servicesOffered.category', select: 'name' })
            .select('verificationStatus servicesOffered user');
        const filtered = providers.filter(p => p.user && p.user.role === 'provider');
        res.status(200).json({ success: true, count: filtered.length, data: filtered });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get single provider details (admin)
// @route   GET /api/admin/providers/:id
// @access  Private (Admin)
exports.getProviderDetails = async (req, res) => {
    try {
        const provider = await ProviderProfile.findById(req.params.id)
            .populate('user', 'name email role')
            .populate({ path: 'servicesOffered.service', select: 'name' })
            .populate({ path: 'servicesOffered.category', select: 'name' })
            .select('verificationStatus servicesOffered user');
        if (!provider || !provider.user || provider.user.role !== 'provider') {
            return res.status(404).json({ success: false, error: 'Provider not found' });
        }
        res.status(200).json({ success: true, data: provider });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get provider services (admin) - authoritative from ProviderService collection
// @route   GET /api/admin/providers/:id/services
// @access  Private (Admin)
exports.getProviderServicesAdmin = async (req, res) => {
    try {
        const providerId = req.params.id;
        const profile = await ProviderProfile.findById(providerId).select('_id user');
        if (!profile) {
            return res.status(404).json({ success: false, error: 'Provider profile not found' });
        }
        const offerings = await ProviderService.find({ provider: profile._id, isActive: true })
            .populate({
                path: 'service',
                select: 'name description category basePrice',
                populate: { path: 'category', select: 'name' }
            })
            .select('providerPrice pricingType createdAt updatedAt service');
        res.status(200).json({ success: true, count: offerings.length, data: offerings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    List admin broadcasts (aggregated)
// @route   GET /api/admin/notifications
// @access  Private (Admin)
exports.getAdminNotifications = async (req, res) => {
    try {
        const broadcasts = await Notification.aggregate([
            { $match: { 'data.broadcastId': { $exists: true } } },
            {
                $group: {
                    _id: '$data.broadcastId',
                    title: { $first: '$title' },
                    message: { $first: '$message' },
                    type: { $first: '$type' },
                    recipientType: { $first: '$data.recipientType' },
                    sentAt: { $min: '$createdAt' },
                    totalRecipients: { $sum: 1 },
                    readCount: { $sum: { $cond: [{ $eq: ['$read', true] }, 1, 0] } }
                }
            },
            { $sort: { sentAt: -1 } },
            { $limit: 100 }
        ]);
        res.status(200).json({ success: true, data: broadcasts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Broadcast notification
// @route   POST /api/admin/notifications/broadcast
// @access  Private (Admin)
exports.broadcastNotifications = async (req, res) => {
    try {
        const { title, message, recipientType = 'all', userIds = [] } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, error: 'Title and message are required' });
        }
        let recipients = [];
        if (recipientType === 'specific') {
            recipients = await User.find({ _id: { $in: userIds } }).select('_id');
        } else if (recipientType === 'customers') {
            recipients = await User.find({ role: 'customer' }).select('_id');
        } else if (recipientType === 'providers') {
            recipients = await User.find({ role: 'provider' }).select('_id');
        } else {
            recipients = await User.find({}).select('_id');
        }
        const broadcastId = require('crypto').randomUUID();
        for (const u of recipients) {
            await sendNotification(u._id, title, message, 'system', { broadcastId, recipientType });
        }
        res.status(200).json({ success: true, data: { broadcastId, totalRecipients: recipients.length } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete a broadcast (remove all user notifications tied to it)
// @route   DELETE /api/admin/notifications/:broadcastId
// @access  Private (Admin)
exports.deleteAdminBroadcast = async (req, res) => {
    try {
        const { broadcastId } = req.params;
        await Notification.deleteMany({ 'data.broadcastId': broadcastId });
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update User
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        await user.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update Provider Verification Status
// @route   PUT /api/admin/providers/:id
// @access  Private (Admin)
exports.updateProviderStatus = async (req, res) => {
    try {
        const { verificationStatus } = req.body;
        const profile = await ProviderProfile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({ success: false, error: 'Provider profile not found' });
        }

        profile.verificationStatus = verificationStatus;
        if (verificationStatus === 'verified') {
            profile.isVerified = true;
        } else {
            profile.isVerified = false;
        }

        await profile.save();
        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get Audit Logs
// @route   GET /api/admin/audit
// @access  Private (Admin)
exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await require('../models/AuditLog').find()
            .populate('user', 'name email role')
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
