const Service = require('../models/Service');
const ServiceCategory = require('../models/ServiceCategory');
const ProviderService = require('../models/ProviderService');

exports.getServices = async (req, res) => {
    try {
        const services = await Service.find().populate('category');
        res.status(200).json({ success: true, count: services.length, data: services });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.createService = async (req, res) => {
    try {
        const service = await Service.create(req.body);
        res.status(201).json({ success: true, data: service });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await ServiceCategory.find();
        res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const category = await ServiceCategory.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.updateService = async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!service) return res.status(404).json({ success: false, error: 'Service not found' });
        res.status(200).json({ success: true, data: service });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) return res.status(404).json({ success: false, error: 'Service not found' });
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// Public list of active provider services (marketplace)
exports.getProviderServicesPublic = async (req, res) => {
    try {
        const offerings = await ProviderService.find({ isActive: true })
            .populate({
                path: 'service',
                select: 'name description category basePrice',
                populate: { path: 'category', select: 'name' }
            })
            .populate({
                path: 'provider',
                populate: { path: 'user', select: 'name' }
            });

        res.status(200).json({ success: true, count: offerings.length, data: offerings });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
