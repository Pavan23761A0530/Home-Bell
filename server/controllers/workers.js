const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const WorkerAssignment = require('../models/WorkerAssignment');

exports.createWorker = async (req, res) => {
  try {
    const { name, email, password, phone, skill, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can add workers' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    const providerProfile = await ProviderProfile.findOne({ user: req.user.id });

    const worker = await User.create({
      name,
      email,
      password,
      role: 'worker',
      providerId: req.user.id,
      addresses: address ? [{ label: 'Work', ...address }] : []
    });

    res.status(201).json({ success: true, data: { id: worker._id, name: worker.name, email: worker.email, role: worker.role } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.listWorkers = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can list workers' });
    }
    const workers = await User.find({ role: 'worker', providerId: req.user.id }).select('-password');
    try {
      console.log('Workers count for provider(me):', workers.length);
    } catch {}
    res.status(200).json({ success: true, count: workers.length, data: workers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.listWorkersByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    if (req.user.role === 'provider' && String(req.user.id) !== String(providerId)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view other providers’ workers' });
    }
    const workers = await User.find({ role: 'worker', providerId }).select('-password');
    try {
      console.log('Workers count for providerId', providerId, ':', workers.length);
    } catch {}
    res.status(200).json({ success: true, count: workers.length, data: workers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, error: 'Only providers can delete workers' });
    }
    const worker = await User.findById(req.params.id);
    if (!worker || worker.role !== 'worker' || String(worker.providerId) !== String(req.user.id)) {
      return res.status(404).json({ success: false, error: 'Worker not found or not yours' });
    }
    await WorkerAssignment.deleteMany({ worker: worker._id });
    await worker.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.assignWorker = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'bookingId is required' });
    }
    const worker = await User.findById(req.params.id);
    if (!worker || worker.role !== 'worker' || String(worker.providerId) !== String(req.user.id)) {
      return res.status(404).json({ success: false, error: 'Worker not found or not yours' });
    }
    const assignment = await WorkerAssignment.create({ worker: worker._id, booking: bookingId });
    const saved = await assignment.populate('booking', 'status service customer');
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.myAssignments = async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ success: false, error: 'Only workers can view assignments' });
    }
    const assignments = await WorkerAssignment.find({ worker: req.user.id })
      .populate('booking', 'status service customer scheduledDate')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
