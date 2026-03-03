const express = require('express');
const {
    getAdminDashboard,
    getUsers,
    updateUser,
    deleteUser,
    updateProviderStatus,
    getSettings,
    updateSettings,
    getAllBookings,
    adminUpdateBooking
} = require('../controllers/admin');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', require('../controllers/admin').getAdminStats);
router.get('/dashboard', getAdminDashboard);
router.get('/providers', require('../controllers/admin').getAllProviders);
router.get('/providers/:id', require('../controllers/admin').getProviderDetails);
router.get('/providers/:id/services', require('../controllers/admin').getProviderServicesAdmin);
router.get('/notifications', require('../controllers/admin').getAdminNotifications);
router.post('/notifications/broadcast', require('../controllers/admin').broadcastNotifications);
router.delete('/notifications/:broadcastId', require('../controllers/admin').deleteAdminBroadcast);

router.route('/users')
    .get(getUsers);

router.route('/users/:id')
    .put(updateUser)
    .delete(deleteUser);

router.route('/providers/:id')
    .put(updateProviderStatus);

router.route('/bookings')
    .get(getAllBookings);

router.route('/bookings/:id')
    .put(adminUpdateBooking);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

router.get('/audit', require('../controllers/admin').getAuditLogs);

module.exports = router;
