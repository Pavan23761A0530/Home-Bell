const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

let transporter = null;
function getTransporter() {
  if (!nodemailer) return null;
  if (transporter) return transporter;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (emailUser && emailPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      auth: { user: emailUser, pass: emailPass }
    });
    transporter.verify().then(() => {
      console.log('[sendOTP] Transporter verified (gmail)');
    }).catch(err => {
      console.error('[sendOTP] Transporter verify failed:', err?.message || err);
    });
    return transporter;
  }
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '0', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && port && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      auth: { user, pass }
    });
    transporter.verify().then(() => {
      console.log('[sendOTP] Transporter verified (smtp)');
    }).catch(err => {
      console.error('[sendOTP] Transporter verify failed:', err?.message || err);
    });
    return transporter;
  }
  return null;
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendOTP(toEmail, otp) {
  try {
    console.log('[sendOTP] Email function triggered');
    console.log('[sendOTP] EMAIL_USER (sender) =', process.env.EMAIL_USER);
    console.log('[sendOTP] Intended recipient (to) =', toEmail);
    if (!toEmail || !isValidEmail(toEmail)) {
      console.error('[sendOTP] Invalid or missing recipient email');
      throw new Error('Invalid recipient email');
    }
    const sendTimeoutMs = parseInt(process.env.EMAIL_SEND_TIMEOUT_MS || (process.env.NODE_ENV === 'production' ? '15000' : '5000'), 10);
    if (!nodemailer) {
      console.error('[sendOTP] nodemailer not installed');
      throw new Error('Email library not available');
    }
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const t = getTransporter();
    if (!t) {
      console.error('[sendOTP] Transporter not configured (missing EMAIL_USER/PASS or SMTP settings)');
      throw new Error('Transporter not configured');
    }
    const subject = 'Your OTP Code';
    const text = `Your OTP code is ${otp}. It will expire in 5 minutes.`;
    const html = `<p>Your OTP code is <strong>${otp}</strong>.</p><p>It will expire in 5 minutes.</p>`;
    const fromAddress = process.env.FROM_EMAIL || emailUser || process.env.SMTP_USER;
    console.log('[sendOTP] Sending email FROM', fromAddress, 'TO', toEmail);
    const sendPromise = t.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text,
      html
    });
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), sendTimeoutMs));
    const result = await Promise.race([sendPromise, timeoutPromise]);
    if (result && result.timeout) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[sendOTP] Email send timed out in production');
        return { success: false, error: 'Email send timeout' };
      } else {
        sendPromise.then((info) => {
          console.log('[sendOTP] Email sent (delayed). MessageId:', info?.messageId);
        }).catch((err) => {
          console.error('[sendOTP] Email send failed (delayed):', err?.message || err);
        });
        console.log('[sendOTP] Email sending deferred to background');
        return { success: true, deferred: true };
      }
    }
    console.log('[sendOTP] Email sent. MessageId:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (err) {
    console.error('[sendOTP] Error sending email:', err?.message || err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

module.exports = { sendOTP };
