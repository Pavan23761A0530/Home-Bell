const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const run = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI is missing');
      process.exit(1);
    }
    await mongoose.connect(uri);
    const Booking = require('../models/Booking');

    const total = await Booking.countDocuments();
    const missingField = await Booking.countDocuments({ provider: { $exists: false } });
    const nullProvider = await Booking.countDocuments({ provider: null });
    const sample = await Booking.find({}, { _id: 1, provider: 1, service: 1, status: 1 }).limit(10).lean();

    console.log(JSON.stringify({ total, missingField, nullProvider, sample }, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('DB check failed:', err.message);
    process.exit(1);
  }
};

run();
