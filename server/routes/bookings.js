const express = require('express');
const {
    createBooking,
    getBookings,
    getBooking,
    updateBookingStatus,
    signContract,
    processPayment,
    cancelBooking,
    getProviderActiveBookings,
    getProviderActiveBookingsMe,
    getWorkerBookings,
    assignBookingWorker
} = require('../controllers/bookings');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Protect all routes

router.route('/')
    .post(authorize('customer', 'provider', 'admin'), createBooking)
    .get(getBookings);

router.route('/:id').get(getBooking);

router.route('/:id/status')
    .put(authorize('provider', 'admin', 'worker'), updateBookingStatus);

router.route('/:id/cancel')
    .put(authorize('customer', 'admin'), cancelBooking);

router.route('/:id/sign')
    .put(signContract);

router.route('/:id/pay')
    .put(authorize('customer'), processPayment);

// Provider and worker flows
router.get('/provider/me', authorize('provider', 'admin'), getProviderActiveBookingsMe);
router.get('/provider/:providerId', authorize('provider', 'admin'), getProviderActiveBookings);
router.get('/worker/:workerId', authorize('worker', 'admin', 'provider'), getWorkerBookings);
router.put('/assign/:bookingId', authorize('provider'), assignBookingWorker);

module.exports = router;
