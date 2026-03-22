const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  codeHash: { type: String, required: true },
  purpose: { type: String, enum: ['login', 'signup'], required: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('OtpCode', otpSchema);
