const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { sendOTP } = require('../services/sendOTP');

async function main() {
  const to = process.argv[2] || process.env.EMAIL_USER;
  if (!to) {
    console.error('Usage: node scripts/testMail.js <recipient_email>');
    process.exit(1);
  }
  const otp = Math.floor(100000 + Math.random() * 900000);
  console.log('Testing email send to:', to, 'OTP:', otp);
  const res = await sendOTP(to, otp);
  console.log('Result:', res);
  if (!res.success) process.exit(1);
}

main().catch((e) => {
  console.error('Test mail failed:', e?.message || e);
  process.exit(1);
});
