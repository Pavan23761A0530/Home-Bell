const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');
const GeneratedContract = require('../models/GeneratedContract');
const Service = require('../models/Service');
const ProviderService = require('../models/ProviderService');
const { sendBookingNotification } = require('../controllers/notifications');
const geoService = require('../services/geoService');
const contractService = require('../services/contractService');

// Helper to normalize status to pending/assigned/ongoing/completed/cancelled
const normalizeStatus = (status, hasWorker) => {
    if (status === 'searching-provider') return 'pending';
    if (status === 'assigned') {
        return hasWorker ? 'assigned' : 'pending';
    }
    if (status === 'accepted' || status === 'in-progress') return 'ongoing';
    if (status === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    return status;
};

// @desc    Create a new booking & auto-assign provider
// @route   POST /api/bookings
// @access  Private (Customer)
exports.createBooking = async (req, res) => {
    try {
        const { serviceId, serviceName, date, address = {}, description, usePoints, paymentMethod } = req.body;
        if (!serviceId) {
            return res.status(400).json({ success: false, error: 'serviceId is required' });
        }
        const customerId = req.user.id;

        let providerFromService = null;
        try {
            const ps = await ProviderService.findOne({ service: serviceId }).populate('provider');
            if (ps && ps.provider) {
                providerFromService = ps.provider;
            }
        } catch (e) {
        }

        let coordinates = null;
        if (address.coordinates && Array.isArray(address.coordinates) && address.coordinates.length === 2) {
            coordinates = address.coordinates;
        } else if (
            typeof address.lng === 'number' &&
            typeof address.lat === 'number'
        ) {
            coordinates = [address.lng, address.lat];
        } else if (
            typeof req.body.lng === 'number' &&
            typeof req.body.lat === 'number'
        ) {
            coordinates = [req.body.lng, req.body.lat];
        }

        let providers = [];
        if (!providerFromService && coordinates) {
            providers = await geoService.findNearbyProviders(coordinates, serviceId);
        }
        // Fallback: if no coordinates or nearby providers found, assign any verified available provider offering the service
        if (!providerFromService && (!providers || providers.length === 0)) {
            try {
                const fallback = await ProviderService.find({
                    service: serviceId,
                    isActive: true
                }).populate({
                    path: 'provider',
                    match: { availability: true, isVerified: true }
                });
                
                // Filter out results where the provider match failed
                const validFallbacks = fallback.filter(f => f.provider);
                if (validFallbacks && validFallbacks.length > 0) {
                    providerFromService = validFallbacks[0].provider;
                }
            } catch (e) {
            }
        }

        let assignedProvider = null;
        let initialStatus = paymentMethod === 'cod' ? 'searching-provider' : 'pending-payment';

        if (providerFromService) {
            assignedProvider = providerFromService;
        } else if (providers && providers.length > 0) {
            assignedProvider = providers[0];
        }

        // Fetch provider-specific price from ProviderService for assignedProvider
        const ProviderService = require('../models/ProviderService');
        let providerPrice = null;
        let providerServiceDoc = null;
        if (assignedProvider) {
            providerServiceDoc = await ProviderService.findOne({
                provider: assignedProvider._id,
                service: serviceId
            }).select('providerPrice');
            if (!providerServiceDoc || typeof providerServiceDoc.providerPrice !== 'number') {
                return res.status(400).json({ success: false, error: 'Provider-specific price not found for this service' });
            }
            providerPrice = Number(providerServiceDoc.providerPrice);
        } else {
            // If no provider assigned yet, pick any active provider’s price as a provisional value
            providerServiceDoc = await ProviderService.findOne({ service: serviceId }).select('providerPrice provider');
            if (!providerServiceDoc || typeof providerServiceDoc.providerPrice !== 'number') {
                return res.status(400).json({ success: false, error: 'No provider price available for this service' });
            }
            providerPrice = Number(providerServiceDoc.providerPrice);
            if (!assignedProvider) {
                try {
                    assignedProvider = await ProviderProfile.findById(providerServiceDoc.provider);
                } catch {}
            }
        }
        console.log('Resolved provider price for booking:', { serviceId, providerId: assignedProvider?._id, price: providerPrice });

        let finalPrice = providerPrice;
        let discountAmount = 0;
        let usedPoints = 0;

        const userDoc = await User.findById(customerId);

        if (usePoints) {
            if (userDoc && userDoc.couponPoints >= 50) {
                discountAmount = providerPrice * 0.10;
                finalPrice = providerPrice - discountAmount;
                
                if (finalPrice < 0) {
                    discountAmount = providerPrice;
                    finalPrice = 0;
                }
                
                discountAmount = Math.round(discountAmount * 100) / 100;
                finalPrice = Math.round(finalPrice * 100) / 100;
                
                // Deduct precisely 50 points for this booking discount
                userDoc.couponPoints -= 50;
                usedPoints = 50;
                console.log(`[Coupon Points] Deducted 50 points for 10% discount. Remaining: ${userDoc.couponPoints}`);
            }
        }
        
        // Native reward increments for COD (since COD never hits /payment/verify)
        if (paymentMethod === 'cod') {
            userDoc.couponPoints += 6;
            console.log(`[Coupon Points] Granted +6 points strictly for COD payment confirmation.`);
            
            // Validate bonus threshold dynamically for COD
            const completedBookings = await Booking.countDocuments({ customer: customerId, status: { $in: ['completed'] } });
            if (completedBookings === 15) { // exactly 15 historically
               userDoc.couponPoints += 20;
               console.log(`[Coupon Points] Bonus +20 hit for 15 COD-aligned bookings!`);
            }
        }
        
        const bookingPayload = {
            customer: customerId,
            service: serviceId,
            status: initialStatus,
            scheduledDate: date,
            address: {
                ...address
            },
            description,
            price: providerPrice,
            finalPrice: finalPrice,
            originalPrice: providerPrice,
            discountAmount,
            usedPoints,
            paymentMethod,
            paymentStatus: 'pending'
        };

        if (coordinates) {
            bookingPayload.address.type = 'Point';
            bookingPayload.address.coordinates = coordinates;
        }

        if (assignedProvider) {
            bookingPayload.provider = assignedProvider._id;
            // For COD, confirm immediately. For Online, keep pending-payment.
            if (paymentMethod === 'cod') {
                bookingPayload.status = 'assigned';
            }
        }

        const booking = await Booking.create(bookingPayload);
        
        // Save user points only after booking document is successfully created
        await userDoc.save();
        
        try {
            console.log('Created booking document:', booking.toObject());
        } catch {}

        if (assignedProvider && paymentMethod === 'cod') {
            assignedProvider.currentActiveJobs += 1;
            await assignedProvider.save();
        }

        if (assignedProvider && paymentMethod === 'cod') {
            await sendBookingNotification(
                booking._id,
                'assigned',
                [assignedProvider.user],
                'A new booking has been assigned to you.'
            );
        }

        res.status(201).json({
            success: true,
            data: booking,
            message: paymentMethod === 'cod' ? 'Booking created and provider assigned.' : 'Booking created. Proceeding to payment.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get all bookings for current user
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res) => {
    try {
        let query;

        if (req.user.role === 'customer') {
            query = { customer: req.user.id };
        } else if (req.user.role === 'provider') {
            // Find provider profile id first
            const profile = await ProviderProfile.findOne({ user: req.user.id });
            if (!profile) return res.status(404).json({ success: false, error: 'Provider profile not found' });
            
            // Get offered services from ProviderService
            const offerings = await ProviderService.find({ provider: profile._id, isActive: true });
            const offeredServiceIds = offerings.map(o => o.service.toString());

            query = {
                $or: [
                    { provider: profile._id },
                    { service: { $in: offeredServiceIds }, status: { $in: ['searching-provider', 'assigned'] } }
                ]
            };
        } else {
            // Admin sees all
            query = {};
        }

        const bookings = await Booking.find(query)
            .populate('service', 'name')
            .populate('customer', 'name')
            .populate('provider')
            .populate('worker', 'name email')
            .sort({ createdAt: -1 });

        const profile = req.user.role === 'provider' ? await ProviderProfile.findOne({ user: req.user.id }) : null;

        const normalized = bookings.map(b => {
            const obj = b.toObject();
            obj.statusNormalized = normalizeStatus(b.status, !!b.worker);
            if (profile && req.user.role === 'provider') {
                obj.isAssignedToMe = b.provider && b.provider._id.toString() === profile._id.toString();
            }
            return obj;
        });

        res.status(200).json({ success: true, count: normalized.length, data: normalized });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('customer', 'name email addresses')
            .populate({
                path: 'provider',
                populate: { path: 'user', select: 'name email' }
            })
            .populate('service', 'name description')
            .populate('worker', 'name email')
            .populate('contract');

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // Access control
        // Allow if: Customer is owner, OR Provider is assigned, OR Admin
        const isCustomer = booking.customer._id.toString() === req.user.id;
        let isProvider = false;

        if (req.user.role === 'provider') {
            const profile = await ProviderProfile.findOne({ user: req.user.id });
            if (profile && booking.provider._id.toString() === profile._id.toString()) {
                isProvider = true;
            }
        }

        if (!isCustomer && !isProvider && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update Booking Status (Accept/Reject/Complete)
// @route   PUT /api/bookings/:id/status
// @access  Private (Provider/Admin)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status, paymentStatus } = req.body;
        let booking = await Booking.findById(req.params.id)
            .populate('customer', 'name')
            .populate({
                path: 'provider',
                populate: { path: 'user', select: 'name' }
            })
            .populate('service', 'name');

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // Allow updating paymentStatus separately or along with status
        if (paymentStatus) {
            booking.paymentStatus = paymentStatus;
        }

        // Handle unassigned or searching/assigned booking being accepted by a provider
        if (['searching-provider', 'assigned'].includes(booking.status) && req.user.role === 'provider' && (status === 'accepted' || status === 'assigned')) {
            const profile = await ProviderProfile.findOne({ user: req.user.id });
            if (!profile) return res.status(404).json({ success: false, error: 'Provider profile not found' });

            // Check if provider offers this service in ProviderService
            const offering = await ProviderService.findOne({ provider: profile._id, service: booking.service._id, isActive: true });
            if (!offering) return res.status(403).json({ success: false, error: 'You do not offer this service' });

            // If it was tentatively assigned to someone else, decrement their job count
            if (booking.provider && booking.provider._id.toString() !== profile._id.toString()) {
                const oldProvider = await ProviderProfile.findById(booking.provider._id);
                if (oldProvider) {
                    oldProvider.currentActiveJobs = Math.max(0, oldProvider.currentActiveJobs - 1);
                    await oldProvider.save();
                }
            }

            // Increment job count for the new provider if they were not already the assigned one
            if (!booking.provider || booking.provider._id.toString() !== profile._id.toString()) {
                profile.currentActiveJobs += 1;
                await profile.save();
            }

            booking.provider = profile._id;
            // Populate provider for contract generation and notifications
            await booking.populate({
                path: 'provider',
                populate: { path: 'user', select: 'name' }
            });

            // Move it to assigned first so the logic below can transition it to accepted
            if (booking.status === 'searching-provider') {
                booking.status = 'assigned';
            }
        }

        // Access Control: Ensure only the assigned provider, assigned worker, or admin can update
        let isAuthorized = false;
        if (req.user.role === 'admin') {
            isAuthorized = true;
        } else if (req.user.role === 'provider') {
            const profile = await ProviderProfile.findOne({ user: req.user.id });
            if (profile && String(booking.provider?._id || booking.provider) === String(profile._id)) {
                isAuthorized = true;
            }
        } else if (req.user.role === 'worker') {
            if (booking.worker && String(booking.worker) === String(req.user.id)) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(401).json({ success: false, error: 'Not authorized to update this booking' });
        }

        // State Machine Validation (Basic)
        // assigned -> accepted OR cancelled
        // accepted -> in-progress
        // in-progress -> completed

        if (status === 'accepted' && (booking.status === 'assigned' || booking.status === 'searching-provider')) {
            booking.status = 'accepted';

            // Generate Contract
            const contractContent = contractService.generateContractContent(contractService.defaultTemplate, {
                customerName: booking.customer.name,
                providerName: booking.provider.user.name,
                serviceName: booking.service.name,
                price: booking.finalPrice || booking.price,
                date: booking.scheduledDate,
                address: `${booking.address.street}, ${booking.address.city}`
            });

            const contract = await GeneratedContract.create({
                booking: booking._id,
                content: contractContent,
                status: 'active'
            });

            booking.contract = contract._id;

        } else if (status === 'in-progress' && booking.status === 'accepted') {
            booking.status = 'in-progress';
        } else if (status === 'in-progress' && booking.status === 'assigned') {
            // allow direct start from assigned
            booking.status = 'in-progress';
        } else if (status === 'in-progress' && booking.status === 'in-progress') {
            // allow staying in-progress (e.g., when collecting money)
            booking.status = 'in-progress';
        } else if (status === 'completed' && booking.status === 'in-progress') {
            // Prevent completion for COD if not paid
            if (booking.paymentMethod === 'cod' && booking.paymentStatus !== 'paid') {
                return res.status(400).json({ success: false, error: 'Please collect payment before completing job' });
            }
            booking.status = 'completed';

            // If it was an Online payment, ensure paymentStatus is marked as paid
            // For COD, the payment is typically received at completion
            if (booking.paymentMethod === 'cod') {
                booking.paymentStatus = 'paid';
            }

            // Update provider stats
            const provider = await ProviderProfile.findById(booking.provider);
            if (provider) {
                provider.currentActiveJobs = Math.max(0, provider.currentActiveJobs - 1);
                provider.jobsCompleted = (provider.jobsCompleted || 0) + 1;
                await provider.save();
            }

        } else if (status === 'cancelled') {
            booking.status = 'cancelled';
            const provider = await ProviderProfile.findById(booking.provider);
            if (provider) {
                provider.currentActiveJobs = Math.max(0, provider.currentActiveJobs - 1);
                await provider.save();
            }
        } else {
            return res.status(400).json({ success: false, error: `Invalid status transition from ${booking.status} to ${status}` });
        }

        await booking.save();

        // Send notification for status change
        if (booking.provider && booking.customer) {
            const recipientIds = [];
            if (status === 'accepted' || status === 'in-progress' || status === 'completed') {
                recipientIds.push(booking.customer._id.toString());
            } else if (status === 'cancelled') {
                if (booking.provider.user) recipientIds.push(booking.provider.user.toString());
            }
            if (recipientIds.length > 0) {
                await sendBookingNotification(booking._id, status, recipientIds);
            }
        }

        res.status(200).json({ success: true, data: booking });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get active bookings for provider (pending/ongoing)
// @route   GET /api/bookings/provider/:providerId
// @access  Private (Provider/Admin)
exports.getProviderActiveBookings = async (req, res) => {
    try {
        const { providerId } = req.params;
        const profile = await ProviderProfile.findOne({ user: providerId });
        if (!profile) return res.status(404).json({ success: false, error: 'Provider profile not found' });

        const filterStatuses = ['searching-provider', 'assigned', 'accepted', 'in-progress'];
        const statusQuery = req.query.raw === '1' ? {} : { status: { $in: filterStatuses } };
        const bookings = await Booking.find({ provider: profile._id, ...statusQuery })
            .populate({
                path: 'service',
                select: 'name category',
                populate: { path: 'category', select: 'name' }
            })
            .populate('customer', 'name phone')
            .populate('provider', '_id user')
            .populate('worker', 'name email')
            .sort({ createdAt: -1 });

        console.log('Provider bookings count:', bookings.length);

        const normalized = bookings.map(b => {
            const obj = b.toObject();
            obj.statusNormalized = normalizeStatus(b.status, !!b.worker);
            // Expose important fields explicitly for frontend convenience
            obj.price = b.finalPrice || b.price;
            obj.customerPhone = b.customer?.phone || b.phoneNumber || null;
            obj.address = b.address;
            return obj;
        });
        res.status(200).json({ success: true, count: normalized.length, data: normalized });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get provider bookings using auth token (provider me)
// @route   GET /api/bookings/provider/me
// @access  Private (Provider/Admin)
exports.getProviderActiveBookingsMe = async (req, res) => {
    try {
        const profile = await ProviderProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ success: false, error: 'Provider profile not found' });

        // Get list of service IDs this provider offers from ProviderService
        const offerings = await ProviderService.find({ provider: profile._id, isActive: true });
        const offeredServiceIds = offerings.map(o => o.service.toString());

        const filterStatuses = ['searching-provider', 'assigned', 'accepted', 'in-progress'];
        const statusQuery = req.query.raw === '1' ? {} : { status: { $in: filterStatuses } };

        // Query for bookings that:
        // 1. Are already assigned to this provider
        // 2. OR are in 'searching-provider' or 'assigned' status and match the provider's services
        const bookings = await Booking.find({
            $or: [
                { provider: profile._id },
                { service: { $in: offeredServiceIds }, status: { $in: ['searching-provider', 'assigned'] } }
            ],
            ...statusQuery
        })
            .populate({
                path: 'service',
                select: 'name category',
                populate: { path: 'category', select: 'name' }
            })
            .populate('customer', 'name phone')
            .populate('provider', '_id user')
            .populate('worker', 'name email')
            .sort({ createdAt: -1 });

        console.log('Provider(me) bookings count:', bookings.length);

        const normalized = bookings.map(b => {
            const obj = b.toObject();
            obj.statusNormalized = normalizeStatus(b.status, !!b.worker);
            obj.price = b.finalPrice || b.price;
            obj.customerPhone = b.customer?.phone || b.phoneNumber || null;
            obj.address = b.address;
            
            // Check if this booking is assigned specifically to the current provider
            obj.isAssignedToMe = b.provider && b.provider._id.toString() === profile._id.toString();
            return obj;
        });
        res.status(200).json({ success: true, count: normalized.length, data: normalized });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get bookings for worker
// @route   GET /api/bookings/worker/:workerId
// @access  Private (Worker/Admin/Provider owner)
exports.getWorkerBookings = async (req, res) => {
    try {
        const { workerId } = req.params;
        const bookings = await Booking.find({ worker: workerId })
            .populate('service', 'name')
            .populate('customer', 'name email phone addresses')
            .populate({
                path: 'provider',
                populate: { path: 'user', select: 'name email' }
            })
            .sort({ createdAt: -1 });
        const normalized = bookings.map(b => ({ ...b.toObject(), statusNormalized: normalizeStatus(b.status, !!b.worker) }));
        res.status(200).json({ success: true, count: normalized.length, data: normalized });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Assign worker to booking (Provider only)
// @route   PUT /api/bookings/assign/:bookingId
// @access  Private (Provider)
exports.assignBookingWorker = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { workerId } = req.body;
        if (!workerId) return res.status(400).json({ success: false, error: 'workerId is required' });
        // Verify provider ownership
        const profile = await ProviderProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ success: false, error: 'Provider profile not found' });
        const worker = await User.findById(workerId);
        if (!worker || worker.role !== 'worker' || String(worker.providerId) !== String(req.user.id)) {
            return res.status(403).json({ success: false, error: 'Invalid worker selection' });
        }
        const booking = await Booking.findById(bookingId)
            .populate('service', 'name')
            .populate('customer', 'name')
            .populate('provider')
            .populate('worker', 'name email');
        if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
        const bookingProviderId = String(booking.provider?._id || booking.provider || '');
        if (bookingProviderId !== String(profile._id)) {
            return res.status(403).json({ success: false, error: 'Not authorized for this booking' });
        }
        booking.worker = worker._id;
        booking.status = 'assigned';
        await booking.save();
        const updated = await Booking.findById(booking._id)
            .populate('service', 'name')
            .populate('customer', 'name')
            .populate('provider')
            .populate('worker', 'name email');
        res.status(200).json({ success: true, data: { ...updated.toObject(), statusNormalized: normalizeStatus(updated.status, !!updated.worker) } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
// @desc    Cancel booking (Customer) with time restriction
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Customer)
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('customer', 'name')
            .populate({
                path: 'provider',
                populate: { path: 'user', select: 'name' }
            })
            .populate('service', 'name');

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.customer._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to cancel this booking' });
        }

        if (booking.status === 'cancelled' || booking.status === 'completed') {
            return res.status(400).json({ success: false, error: 'Booking cannot be cancelled' });
        }

        const createdAt = booking.createdAt ? booking.createdAt.getTime() : null;
        if (!createdAt) {
            return res.status(400).json({ success: false, error: 'Invalid booking timestamp' });
        }

        const diffMinutes = (Date.now() - createdAt) / (60 * 1000);
        
        let refundData = null;

        // Process Refund if online payment
        if (booking.paymentStatus === 'paid' && booking.paymentDetails?.razorpay_payment_id) {
            const Razorpay = require('razorpay');
            
            // Check if keys are present to avoid crash
            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
                console.error('[Refund] Razorpay keys are missing. Refund failed for booking:', booking._id);
                booking.paymentDetails = {
                    ...booking.paymentDetails,
                    refundStatus: 'FAILED',
                    refundError: 'Payment gateway keys are not configured in environment variables.',
                    cancelledAt: new Date()
                };
            } else {
                const razorpay = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET
                });

                // Base price calculation (using booking price)
                const price = Number(booking.finalPrice || booking.price);
                let refundAmount = price;
                let refundStatus = 'PROCESSED';

                if (diffMinutes > 10) {
                    // 50% penalty if after 10 minutes
                    refundAmount = price * 0.5;
                    refundStatus = 'PENDING (24h processing)';
                }

                try {
                    // Razorpay expects refund amounts in paise
                    const refundAmountPaise = Math.round(refundAmount * 100);
                    
                    console.log(`[Refund] Attempting refund for payment ${booking.paymentDetails.razorpay_payment_id}. Amount: ${refundAmount} INR (${refundAmountPaise} paise)`);
                    
                    const refundResponse = await razorpay.payments.refund(booking.paymentDetails.razorpay_payment_id, {
                        amount: refundAmountPaise,
                        notes: {
                            reason: diffMinutes <= 10 ? 'Cancelled within 10 minutes (Full Refund)' : 'Cancelled after 10 minutes (Partial Refund)',
                            bookingId: booking._id.toString()
                        }
                    });

                    console.log(`[Refund] Success for booking ${booking._id}:`, refundResponse.id);

                    refundData = {
                        refundId: refundResponse.id,
                        refundAmount,
                        refundPercentage: diffMinutes <= 10 ? '100%' : '50%',
                        refundStatus: 'COMPLETED',
                        cancelledAt: new Date()
                    };

                    // Store inside paymentDetails
                    booking.paymentDetails = {
                        ...booking.paymentDetails,
                        ...refundData
                    };
                    
                    booking.paymentStatus = 'refunded';

                } catch (razorpayErr) {
                    console.error(`[Refund] FAILED for booking ${booking._id}:`, JSON.stringify(razorpayErr, null, 2));
                    
                    // If it's a known error (like already refunded), we still want to cancel the booking
                    // but mark the refund as failed in our records for manual intervention
                    booking.paymentDetails = {
                        ...booking.paymentDetails,
                        refundStatus: 'FAILED',
                        refundError: razorpayErr.description || razorpayErr.message || 'Unknown Razorpay Error',
                        cancelledAt: new Date()
                    };
                    
                    // We still proceed to cancel the booking even if refund gateway call fails,
                    // but we keep paymentStatus as 'paid' or mark as 'refund-failed'
                    // User requirement: Do NOT crash, set refundStatus = "FAILED"
                }
            }
        }

        booking.status = 'cancelled';

        if (booking.provider) {
            const provider = await ProviderProfile.findById(booking.provider);
            if (provider) {
                provider.currentActiveJobs = Math.max(0, provider.currentActiveJobs - 1);
                await provider.save();
            }
        }

        await booking.save();

        if (booking.provider && booking.provider.user) {
            await sendBookingNotification(booking._id, 'cancelled', [booking.provider.user.toString()]);
        }

        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Sign Contract
// @route   PUT /api/bookings/:id/sign
// @access  Private
exports.signContract = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking.contract) {
            return res.status(404).json({ success: false, error: 'Contract not generated yet' });
        }

        const contract = await GeneratedContract.findById(booking.contract);

        if (req.user.role === 'customer') {
            contract.customerSignature.signed = true;
            contract.customerSignature.date = Date.now();
            contract.customerSignature.name = req.user.name; // user name from auth token
        } else if (req.user.role === 'provider') {
            contract.providerSignature.signed = true;
            contract.providerSignature.date = Date.now();
            // Logic to get provider name if needed, or use req.user.name
        }

        await contract.save();
        res.status(200).json({ success: true, data: contract });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Process Mock Payment
// @route   PUT /api/bookings/:id/pay
// @access  Private (Customer)
exports.processPayment = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        if (booking.customer.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({ success: false, error: 'Booking already paid' });
        }

        // Mock Payment Success
        booking.paymentStatus = 'paid';
        await booking.save();

        res.status(200).json({ success: true, data: booking, message: 'Payment successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};
