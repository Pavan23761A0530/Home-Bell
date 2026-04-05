const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
    getUserProfile,
    updateUserProfile,
    addAddress,
    deleteAddress
} = require('../controllers/users');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Multer storage for profile images
const uploadDir = path.join(__dirname, '..', 'uploads', 'profile');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            fs.mkdirSync(uploadDir, { recursive: true });
        } catch {}
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ['.jpg', '.jpeg', '.png'].includes(ext) ? ext : '.jpg';
        const name = `user_${req.user.id}_${Date.now()}${safeExt}`;
        cb(null, name);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG/PNG images are allowed'));
};

const upload = multer({ storage, fileFilter });

router.route('/profile')
    .get(getUserProfile)
    .put(upload.single('profileImage'), updateUserProfile);

router.route('/addresses')
    .post(addAddress);

router.route('/addresses/:addressId')
    .delete(deleteAddress);

router.route('/welcome-seen')
    .put(async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ success: false, error: 'User not found' });
            user.hasSeenWelcome = true;
            await user.save();
            res.status(200).json({ success: true, message: 'Welcome seen updated' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

module.exports = router;
