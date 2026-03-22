const express = require('express');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notifications');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getNotifications);

router.route('/:id/read')
    .put(markAsRead);
    
router.route('/mark-all-read')
    .put(markAllAsRead);

module.exports = router;
