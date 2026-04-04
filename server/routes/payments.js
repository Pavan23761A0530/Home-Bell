const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');
const ProviderService = require('../models/ProviderService');
const ProviderProfile = require('../models/ProviderProfile');
const { sendBookingNotification } = require('../controllers/notifications');

// Initialize Razorpay lazily to avoid crash if keys are missing during boot
let razorpay;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        console.log('[Razorpay] Instance initialized successfully');
    } else {
        console.warn('[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET. Payment features will be disabled.');
    }
} catch (err) {
    console.error('[Razorpay] Initialization failed:', err.message);
}

// Helper to get razorpay instance or throw error
const getRazorpay = () => {
    if (!razorpay) {
        throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.');
    }
    return razorpay;
};

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
router.post('/create-order', protect, async (req, res) => {
    try {
        const { bookingId } = req.body;
        
        console.log(`[Razorpay /create-order] Request received for bookingId: ${bookingId}`);
        console.log(`[Razorpay /create-order] Checking RAZORPAY_KEY_ID present:`, process.env.RAZORPAY_KEY_ID ? 'Loaded (starts with ' + process.env.RAZORPAY_KEY_ID.substring(0,8) + '...)' : 'UNDEFINED');
        
        if (!bookingId) {
            return res.status(400).json({ success: false, error: 'bookingId is required' });
        }

        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            console.error(`[Razorpay /create-order] Booking not found for id: ${bookingId}`);
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        console.log(`[Razorpay /create-order] Booking located. Final price from booking record: ${booking.finalPrice}`);

        // Ensure finalPrice exists and is valid (Source of Truth)
        if (typeof booking.finalPrice !== 'number' || booking.finalPrice <= 0) {
            console.error(`[Razorpay /create-order] Invalid finalPrice in booking: ${booking.finalPrice}`);
            return res.status(400).json({ success: false, error: 'Booking has no valid final price' });
        }

        let amountToCharge = booking.finalPrice;
        
        // Price Mismatch Validation: Re-verify against ProviderService to ensure no unauthorized changes
        if (booking.provider && booking.service) {
            const providerServiceDoc = await ProviderService.findOne({
                provider: booking.provider,
                service: booking.service
            });
            if (providerServiceDoc && typeof providerServiceDoc.providerPrice === 'number') {
                const currentBasePrice = providerServiceDoc.providerPrice;
                let expectedFinalPrice = currentBasePrice;
                
                // Re-apply discount logic for verification
                if (booking.usedPoints === 50) {
                    let discountAmount = expectedFinalPrice * 0.10;
                    expectedFinalPrice -= discountAmount;
                    if (expectedFinalPrice < 0) expectedFinalPrice = 0;
                    expectedFinalPrice = Math.round(expectedFinalPrice * 100) / 100;
                }

                if (Math.abs(expectedFinalPrice - booking.finalPrice) > 0.01) {
                    console.error(`[Razorpay /create-order] Price mismatch detected! Expected: ${expectedFinalPrice}, Stored: ${booking.finalPrice}`);
                    return res.status(400).json({ success: false, error: 'Price mismatch detected. Please refresh or contact support.' });
                }
                console.log(`[Razorpay /create-order] Price validation passed. Charged: ${amountToCharge}`);
            }
        }
        
        // Convert to paise ONLY when sending to Razorpay (amount * 100)
        const amountInPaise = Math.round(amountToCharge * 100);

        console.log(`[Razorpay /create-order] Requesting Razorpay creation. Amount (in paise): ${amountInPaise}`);

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_order_${bookingId}`
        };

        let order;
        try {
            order = await getRazorpay().orders.create(options);
        } catch (razorpayErr) {
            console.error(`[Razorpay /create-order] SDK Error creating order:`, razorpayErr);
            return res.status(500).json({ success: false, error: 'Razorpay SDK failed to create order', details: razorpayErr });
        }
        
        console.log(`[Razorpay /create-order] Successfully generated Razorpay order ID: ${order.id}`);

        res.status(200).json({
            success: true,
            keyId: process.env.RAZORPAY_KEY_ID,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            }
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, error: 'Failed to create payment order' });
    }
});

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Private
router.post('/verify', protect, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // update booking status to PAID/CONFIRMED and store payment details
            const booking = await Booking.findById(bookingId).populate('service');
            if (booking) {
                // update booking status to PAID/CONFIRMED and store payment details
                booking.paymentStatus = 'paid';
                
                // If the booking was pending-payment, confirm it now
                if (booking.status === 'pending-payment') {
                    booking.status = booking.provider ? 'assigned' : 'searching-provider';
                    
                    // Update provider active jobs if assigned
                    if (booking.provider) {
                        try {
                            const providerProfile = await ProviderProfile.findById(booking.provider).populate('user');
                            if (providerProfile) {
                                providerProfile.currentActiveJobs += 1;
                                await providerProfile.save();
                                
                                // Send notification to provider
                                await sendBookingNotification(
                                    booking._id,
                                    'assigned',
                                    [providerProfile.user],
                                    'A new paid booking has been assigned to you.'
                                );
                            }
                        } catch (err) {
                            console.error('Error updating provider stats after payment:', err);
                        }
                    }
                }

                booking.paymentDetails = {
                    razorpay_order_id,
                    razorpay_payment_id,
                    razorpay_signature,
                    verifiedAt: new Date()
                };
                await booking.save();
                
                // Reward Points natively for Online Payment Success
                const User = require('../models/User');
                const userDoc = await User.findById(req.user.id);
                if (userDoc) {
                    userDoc.couponPoints += 6;
                    console.log(`[Coupon Points] Granted +6 points strictly for Online payment confirmation.`);
                    
                    const completedBookings = await Booking.countDocuments({ customer: req.user.id, status: { $in: ['completed'] } });
                    if (completedBookings === 15) { // exactly 15 historically
                       userDoc.couponPoints += 20;
                       console.log(`[Coupon Points] Bonus +20 hit for 15 Online-aligned bookings!`);
                    }
                    await userDoc.save();
                }
                
                res.status(200).json({ 
                    success: true, 
                    message: 'Payment verified successfully',
                    paymentData: {
                        paymentId: razorpay_payment_id,
                        amount: booking.finalPrice,
                        serviceName: booking.service ? booking.service.name : 'Service',
                        bookingId: booking._id,
                        date: new Date()
                    }
                });
            } else {
                res.status(404).json({ success: false, error: 'Booking not found' });
            }
        } else {
            // mark payment as failed
            res.status(400).json({ success: false, error: 'Payment signature verification failed. Payment failed.' });
        }

    } catch (error) {
        console.error('Error verifying Razorpay payment:', error);
        res.status(500).json({ success: false, error: 'Failed to verify payment' });
    }
});

module.exports = router;
