const express = require('express');
const { getServices, createService, getCategories, createCategory, updateService, deleteService, getProviderServicesPublic } = require('../controllers/services');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getServices);
router.post('/', protect, authorize('admin'), createService);
router.put('/:id', protect, authorize('admin'), updateService);
router.delete('/:id', protect, authorize('admin'), deleteService);
router.get('/provider-services', getProviderServicesPublic);

router.get('/categories', getCategories);
router.post('/categories', protect, authorize('admin'), createCategory);

module.exports = router;
