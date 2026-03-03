const Notification = require('../models/Notification');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Get all notifications for a user
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: notifications });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        res.status(200).json({ success: true, data: notification });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, read: false },
            { read: true }
        );

        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// Send notification to specific user
const sendNotification = async (recipientId, title, message, type, data = {}) => {
    try {
        const notification = await Notification.create({
            user: recipientId,
            title,
            message,
            type,
            data
        });

        // Emit to recipient via Socket.IO if connected
        const { emitUserNotification } = require('../utils/socketUtil');
        emitUserNotification(recipientId, 'new_notification', notification);

        return notification;
    } catch (err) {
        console.error('Error sending notification:', err);
        return null;
    }
};

// Send booking-related notifications
const sendBookingNotification = async (bookingId, eventType, recipientIds, customMessage = '') => {
    try {
        const booking = await Booking.findById(bookingId)
            .populate('customer provider service')
            .lean();

        if (!booking) {
            console.error('Booking not found for notification');
            return;
        }

        const messages = {
            assigned: `A new booking has been assigned to you`,
            accepted: `Your booking has been accepted by the provider`,
            started: `The provider has started working on your booking`,
            completed: `Your booking has been completed`,
            cancelled: `Your booking has been cancelled`,
            rejected: `Your booking request has been rejected`
        };

        const title = {
            assigned: 'New Booking Assigned',
            accepted: 'Booking Accepted',
            started: 'Booking Started',
            completed: 'Booking Completed',
            cancelled: 'Booking Cancelled',
            rejected: 'Booking Rejected'
        };

        const message = customMessage || messages[eventType] || `Booking status updated to ${eventType}`;

        // Create notifications for each recipient
        for (const recipientId of recipientIds) {
            const notification = await Notification.create({
                user: recipientId,
                title: title[eventType],
                message,
                type: 'booking',
                data: {
                    bookingId: booking._id,
                    service: booking.service.name,
                    date: booking.scheduledDate
                }
            });

            // Emit to recipient via Socket.IO if connected
            const { emitUserNotification } = require('../utils/socketUtil');
            emitUserNotification(recipientId, 'new_notification', notification);
        }
    } catch (err) {
        console.error('Error sending booking notification:', err);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    sendNotification,
    sendBookingNotification
};
