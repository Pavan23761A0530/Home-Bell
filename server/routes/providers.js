const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
    getMe,
    updateProfile,
    addServiceOffering,
    updateServiceOffering,
    getProviderStats,
    uploadDocument,
    deleteDocument
} = require('../controllers/providers');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('provider'));

// Multer for provider profile image
const uploadDir = path.join(__dirname, '..', 'uploads', 'provider_profile');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ['.jpg', '.jpeg', '.png'].includes(ext) ? ext : '.jpg';
        cb(null, `provider_${req.user.id}_${Date.now()}${safeExt}`);
    }
});
const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG/PNG images are allowed'));
};
const upload = multer({ storage, fileFilter });

router.route('/me')
    .get(getMe)
    .put(upload.single('profileImage'), updateProfile);

router.route('/services')
    .get(require('../controllers/providers').getProviderServices)
    .post(addServiceOffering);

router.route('/services/:serviceId')
    .put(updateServiceOffering)
    .delete(require('../controllers/providers').removeServiceOffering);

router.route('/stats')
    .get(getProviderStats);

router.route('/documents')
    .post(require('../controllers/providers').uploadDocument);

router.route('/documents/:documentId')
    .delete(require('../controllers/providers').deleteDocument);

module.exports = router;
