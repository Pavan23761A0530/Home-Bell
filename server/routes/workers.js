const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const workers = require('../controllers/workers');

// Provider operations
router.post('/', protect, workers.createWorker);
router.get('/', protect, workers.listWorkers);
router.get('/provider/:providerId', protect, workers.listWorkersByProvider);
router.delete('/:id', protect, workers.deleteWorker);
router.post('/:id/assign', protect, workers.assignWorker);

// Worker operations
router.get('/me/assignments', protect, workers.myAssignments);

module.exports = router;
