require('dotenv').config();
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

async function sendOTP(toEmail, otp) {
  try {
    console.log('[sendOTP] Email function triggered');
    console.log('[sendOTP] EMAIL_USER =', process.env.EMAIL_USER);
    if (!nodemailer) {
      console.error('[sendOTP] nodemailer not installed');
      throw new Error('Email library not available');
    }
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    if (!emailUser || !emailPass) {
      console.error('[sendOTP] Missing EMAIL_USER or EMAIL_PASS in environment');
      throw new Error('Email credentials not configured');
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass }
    });
    const subject = 'Your OTP Code';
    const text = `Your OTP code is ${otp}. It will expire in 5 minutes.`;
    const html = `<p>Your OTP code is <strong>${otp}</strong>.</p><p>It will expire in 5 minutes.</p>`;
    console.log('[sendOTP] Sending email to', toEmail);
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || emailUser,
      to: toEmail,
      subject,
      text,
      html
    });
    console.log('[sendOTP] Email sent. MessageId:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[sendOTP] Error sending email:', err?.message || err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

module.exports = { sendOTP };
