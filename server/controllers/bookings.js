const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');
const GeneratedContract = require('../models/GeneratedContract');
const Service = require('../models/Service');
const { sendBookingNotification } = require('../controllers/notifications');
const geoService = require('../services/geoService');
const contractService = require('../services/contractService');

// Helper to normalize status to pending/ongoing/completed/cancelled
const normalizeStatus = (status) => {
    if (status === 'searching-provider' || status === 'assigned') return 'pending';
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
        const { serviceId, serviceName, date, address = {}, description } = req.body;
        if (!serviceId) {
            return res.status(400).json({ success: false, error: 'serviceId is required' });
        }
        const customerId = req.user.id;

        let providerFromService = null;
        try {
            providerFromService = await ProviderProfile.findOne({ 'servicesOffered.service': serviceId });
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
                const fallback = await ProviderProfile.find({
                    'servicesOffered.service': serviceId,
                    availability: true,
                    isVerified: true
                }).sort({ currentActiveJobs: 1 }).limit(1);
                if (fallback && fallback.length > 0) {
                    providerFromService = fallback[0];
                }
            } catch (e) {
            }
        }

        let assignedProvider = null;
        let initialStatus = 'searching-provider';

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
            paymentStatus: 'pending'
        };

        if (coordinates) {
            bookingPayload.address.type = 'Point';
            bookingPayload.address.coordinates = coordinates;
        }

        if (assignedProvider) {
            bookingPayload.provider = assignedProvider._id;
        }

        const booking = await Booking.create(bookingPayload);
        try {
            console.log('Created booking document:', booking.toObject());
        } catch {}

        if (assignedProvider) {
            assignedProvider.currentActiveJobs += 1;
            await assignedProvider.save();
        }

        if (assignedProvider) {
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
            message: 'Booking created and provider assigned.'
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
            query = { provider: profile._id };
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

        res.status(200).json({ success: true, count: bookings.length, data: bookings });
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
        const { status } = req.body;
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

        // State Machine Validation (Basic)
        // assigned -> accepted OR cancelled
        // accepted -> in-progress
        // in-progress -> completed

        if (status === 'accepted' && booking.status === 'assigned') {
            booking.status = 'accepted';

            // Generate Contract
            const contractContent = contractService.generateContractContent(contractService.defaultTemplate, {
                customerName: booking.customer.name,
                providerName: booking.provider.user.name,
                serviceName: booking.service.name,
                price: booking.price,
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
        } else if (status === 'completed' && booking.status === 'in-progress') {
            booking.status = 'completed';

            // Release payment (Mock)
            booking.paymentStatus = 'paid';

            // Update provider stats? (done in Review model for rating, but distinct job count could be here)
            const provider = await ProviderProfile.findById(booking.provider);
            provider.currentActiveJobs = Math.max(0, provider.currentActiveJobs - 1);
            await provider.save();

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
            obj.statusNormalized = normalizeStatus(b.status);
            // Expose important fields explicitly for frontend convenience
            obj.price = b.price;
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

        console.log('Provider(me) bookings count:', bookings.length);

        const normalized = bookings.map(b => {
            const obj = b.toObject();
            obj.statusNormalized = normalizeStatus(b.status);
            obj.price = b.price;
            obj.customerPhone = b.customer?.phone || b.phoneNumber || null;
            obj.address = b.address;
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
            .populate('customer', 'name')
            .populate({
                path: 'provider',
                populate: { path: 'user', select: 'name email' }
            })
            .sort({ createdAt: -1 });
        const normalized = bookings.map(b => ({ ...b.toObject(), statusNormalized: normalizeStatus(b.status) }));
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
        res.status(200).json({ success: true, data: { ...updated.toObject(), statusNormalized: normalizeStatus(updated.status) } });
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
        if (diffMinutes > 10) {
            return res.status(400).json({ success: false, error: 'Cancellation period expired' });
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
