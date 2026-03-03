const ProviderProfile = require('../models/ProviderProfile');
const Service = require('../models/Service');
const User = require('../models/User');
const ProviderService = require('../models/ProviderService');

// @desc    Get current provider profile
// @route   GET /api/providers/me
// @access  Private (Provider)
exports.getMe = async (req, res) => {
    try {
        const profile = await ProviderProfile.findOne({ user: req.user.id })
            .populate('user', 'name email addresses')
            .populate('servicesOffered.service', 'name category');

        if (!profile) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get provider's services
// @route   GET /api/providers/services
// @access  Private (Provider)
exports.getProviderServices = async (req, res) => {
    try {
        const profile = await ProviderProfile.findOne({ user: req.user.id });
        if (!profile) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }

        const offerings = await ProviderService.find({ provider: profile._id, isActive: true })
            .populate({
                path: 'service',
                select: 'name description category basePrice',
                populate: { path: 'category', select: 'name' }
            });

        res.status(200).json({ success: true, data: offerings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update provider profile
// @route   PUT /api/providers/me
// @access  Private (Provider)
exports.updateProfile = async (req, res) => {
    try {
        const fields = req.body || {};

        let profile = await ProviderProfile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }

        // Update fields
        // Handle location separately if provided
        if (fields.location) {
            profile.location = {
                type: 'Point',
                coordinates: fields.location.coordinates,
                formattedAddress: fields.location.formattedAddress
            };
            delete fields.location;
        }

        // Parse primitive fields
        if (typeof fields.experienceYears !== 'undefined') profile.experienceYears = Number(fields.experienceYears);
        if (typeof fields.gender !== 'undefined') profile.gender = fields.gender;
        if (typeof fields.dateOfBirth !== 'undefined') profile.dateOfBirth = fields.dateOfBirth ? new Date(fields.dateOfBirth) : undefined;
        if (typeof fields.businessName !== 'undefined') profile.businessName = fields.businessName;
        if (typeof fields.address !== 'undefined') profile.address = fields.address;
        if (typeof fields.city !== 'undefined') profile.city = fields.city;
        if (typeof fields.state !== 'undefined') profile.state = fields.state;
        if (typeof fields.pincode !== 'undefined') profile.pincode = fields.pincode;
        if (typeof fields.phone !== 'undefined') profile.phone = fields.phone;
        if (typeof fields.serviceCategories !== 'undefined') {
            try {
                const arr = Array.isArray(fields.serviceCategories)
                    ? fields.serviceCategories
                    : String(fields.serviceCategories).split(',').map(s => s.trim()).filter(Boolean);
                profile.serviceCategories = arr;
            } catch {
                profile.serviceCategories = [];
            }
        }

        // Handle profile image upload
        if (req.file) {
            const imageUrl = `${req.protocol}://${req.get('host')}/uploads/provider_profile/${req.file.filename}`;
            // remove old file if local path
            if (profile.profileImage) {
                try {
                    const base = `${req.protocol}://${req.get('host')}`;
                    let rel = profile.profileImage.startsWith(base) ? profile.profileImage.replace(base, '') : profile.profileImage;
                    rel = rel.replace(/^[\\/]+/, '');
                    const path = require('path');
                    const fs = require('fs');
                    const abs = path.join(__dirname, '..', rel);
                    if (fs.existsSync(abs)) fs.unlinkSync(abs);
                } catch {}
            }
            profile.profileImage = imageUrl;
        }

        await profile.save();
        res.status(200).json({ success: true, data: profile });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Add a service to provider offerings
// @route   POST /api/providers/services
// @access  Private (Provider)
exports.addServiceOffering = async (req, res) => {
    try {
        const { serviceId, hourlyRate, fixedRate, pricingType } = req.body;

        const profile = await ProviderProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

        const existing = await ProviderService.findOne({ provider: profile._id, service: serviceId });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Service already added' });
        }

        const serviceDoc = await Service.findById(serviceId).select('basePrice');
        const minPrice = Number(serviceDoc?.basePrice) || 0;
        const proposedPrice = typeof fixedRate === 'number' ? fixedRate :
            typeof hourlyRate === 'number' ? hourlyRate : undefined;

        if (typeof proposedPrice !== 'number') {
            return res.status(400).json({ success: false, error: 'Provider price is required' });
        }
        if (proposedPrice < minPrice) {
            return res.status(400).json({ success: false, error: `Price must be at least ₹${minPrice}` });
        }

        const offering = await ProviderService.create({
            provider: profile._id,
            service: serviceId,
            providerPrice: proposedPrice,
            pricingType: pricingType || 'fixed',
            isActive: true
        });

        res.status(200).json({ success: true, data: offering });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update a service offering
// @route   PUT /api/providers/services/:serviceId
// @access  Private (Provider)
exports.updateServiceOffering = async (req, res) => {
    try {
        const { hourlyRate, fixedRate, pricingType } = req.body;
        const profile = await ProviderProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

        const offering = await ProviderService.findOne({ provider: profile._id, service: req.params.serviceId });
        if (!offering) {
            return res.status(404).json({ success: false, error: 'Service offering not found' });
        }

        const proposedPrice = typeof fixedRate === 'number' ? fixedRate :
            typeof hourlyRate === 'number' ? hourlyRate : undefined;
        if (typeof proposedPrice !== 'number') {
            return res.status(400).json({ success: false, error: 'Provider price is required' });
        }

        const serviceDoc = await Service.findById(req.params.serviceId).select('basePrice');
        const minPrice = Number(serviceDoc?.basePrice) || 0;
        if (proposedPrice < minPrice) {
            return res.status(400).json({ success: false, error: `Price must be at least ₹${minPrice}` });
        }

        offering.providerPrice = proposedPrice;
        if (pricingType) {
            offering.pricingType = pricingType;
        }
        await offering.save();
        res.status(200).json({ success: true, data: offering });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get provider dashboard stats
// @route   GET /api/providers/stats
// @access  Private (Provider)
exports.getProviderStats = async (req, res) => {
    try {
        const profile = await ProviderProfile.findOne({ user: req.user.id }).select('_id rating reviewsCount');
        if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

        const Booking = require('../models/Booking');
        const Review = require('../models/Review');

        const providerId = profile._id;

        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);
        const endOfToday = new Date(startOfToday);
        endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
        sevenDaysAgo.setUTCHours(0, 0, 0, 0);

        // Aggregations for earnings and active jobs
        const [
            totalAgg,
            todayAgg,
            weekAgg,
            activeAgg
        ] = await Promise.all([
            Booking.aggregate([
                { $match: { provider: providerId, status: 'completed' } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$price', 0] } } } }
            ]),
            Booking.aggregate([
                { $match: { provider: providerId, status: 'completed', createdAt: { $gte: startOfToday, $lt: endOfToday } } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$price', 0] } } } }
            ]),
            Booking.aggregate([
                { $match: { provider: providerId, status: 'completed', createdAt: { $gte: sevenDaysAgo } } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$price', 0] } } } }
            ]),
            Booking.aggregate([
                { $match: { provider: providerId, status: { $in: ['assigned', 'accepted', 'in-progress'] } } },
                { $count: 'count' }
            ])
        ]);

        // Reviews aggregation for dynamic rating and count
        const reviewsAgg = await Review.aggregate([
            { $match: { provider: providerId } },
            { $group: { _id: '$provider', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        const totalEarnings = totalAgg?.[0]?.total || 0;
        const todaysEarnings = todayAgg?.[0]?.total || 0;
        const weeklyEarnings = weekAgg?.[0]?.total || 0;
        const activeJobs = activeAgg?.[0]?.count || 0;
        const rating = reviewsAgg?.[0]?.avg || 0;
        const reviews = reviewsAgg?.[0]?.count || 0;

        res.status(200).json({
            success: true,
            data: {
                activeJobs,
                rating,
                reviews,
                totalEarnings,
                todaysEarnings,
                weeklyEarnings
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Remove a service from provider offerings
// @route   DELETE /api/providers/services/:serviceId
// @access  Private (Provider)
exports.removeServiceOffering = async (req, res) => {
    try {
        const profile = await ProviderProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

        await ProviderService.findOneAndDelete({ provider: profile._id, service: req.params.serviceId });
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Upload document for verification
// @route   POST /api/providers/documents
// @access  Private (Provider)
exports.uploadDocument = async (req, res) => {
    try {
        // Configure multer for file uploads
        const multer = require('multer');
        const path = require('path');
        const fs = require('fs');
        
        // Ensure uploads directory exists
        const uploadDir = path.join(__dirname, '../uploads/documents');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        });
        
        const upload = multer({ 
            storage: storage,
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
            fileFilter: (req, file, cb) => {
                const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
                const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
                const mimetype = allowedTypes.test(file.mimetype);
                
                if (mimetype && extname) {
                    return cb(null, true);
                } else {
                    cb(new Error('Only images and PDFs are allowed'));
                }
            }
        }).single('document');
        
        // Parse form data with multer
        await new Promise((resolve, reject) => {
            upload(req, res, (err) => {
                if (err) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ success: false, error: 'File too large. Max 5MB.' });
                    }
                    return res.status(400).json({ success: false, error: err.message });
                }
                resolve();
            });
        });
        
        const { documentType } = req.body;
        
        if (!documentType) {
            // Clean up uploaded file if no document type provided
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ success: false, error: 'Document type is required' });
        }
        
        const profile = await ProviderProfile.findOne({ user: req.user.id });
        if (!profile) {
            // Clean up uploaded file if profile not found
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }
        
        // Create document path
        const documentPath = `/uploads/documents/${req.file.filename}`;
        
        // Ensure documents is an array (migrate old string field if necessary)
        if (!Array.isArray(profile.documents)) {
            profile.documents = [];
        }
        // Add document to profile as structured object
        profile.documents.push({
            type: documentType,
            url: documentPath,
            verified: false
        });
        
        // Update verification status to pending
        if (profile.verificationStatus !== 'verified') {
            profile.verificationStatus = 'pending';
        }
        
        await profile.save();
        
        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete a document
// @route   DELETE /api/providers/documents/:documentId
// @access  Private (Provider)
exports.deleteDocument = async (req, res) => {
    try {
        const profile = await ProviderProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
        
        // Remove document by index (since we're using array)
        const docIndex = parseInt(req.params.documentId);
        if (docIndex >= 0 && docIndex < profile.documents.length) {
            profile.documents.splice(docIndex, 1);
        } else {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }
        
        await profile.save();
        
        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
