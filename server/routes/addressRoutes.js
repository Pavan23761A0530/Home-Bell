const express = require('express');
const {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress
} = require('../controllers/addressController');

const router = express.Router();

const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router
    .route('/')
    .get(getAddresses)
    .post(addAddress);

router
    .route('/:id')
    .put(updateAddress)
    .delete(deleteAddress);

module.exports = router;
