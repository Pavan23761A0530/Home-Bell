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
    const secure = port === 465;
    const cfg = {
      host,
      port,
      secure,
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      auth: { user, pass }
    };
    if (!secure) {
      cfg.tls = { rejectUnauthorized: false };
    }
    transporter = nodemailer.createTransport(cfg);
    console.log('[sendOTP] SMTP transporter created', { host, port, secure, tlsNoReject: !secure });
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

function initEmailTransporter() {
  try {
    const t = getTransporter();
    if (!t) {
      console.error('[sendOTP] Email transporter not configured at startup');
      return false;
    }
    t.verify().then(() => {
      console.log('[sendOTP] Startup verify OK');
    }).catch(err => {
      console.error('[sendOTP] Startup verify failed:', err?.message || err);
    });
    return true;
  } catch (e) {
    console.error('[sendOTP] Startup init error:', e?.message || e);
    return false;
  }
}

async function sendOTP(toEmail, otp) {
  try {
    console.log('[sendOTP] Email function triggered');
    console.log('[sendOTP] EMAIL_USER (sender) =', process.env.EMAIL_USER);
    console.log('[sendOTP] Intended recipient (to) =', toEmail);
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.EMAIL_USER && !(process.env.SMTP_HOST && process.env.SMTP_USER)) {
        console.error('[sendOTP] Missing production email credentials (EMAIL_USER/EMAIL_PASS or SMTP_*).');
      }
    }
    if (!toEmail || !isValidEmail(toEmail)) {
      console.error('[sendOTP] Invalid or missing recipient email');
      throw new Error('Invalid recipient email');
    }
    if (process.env.EMAIL_USER && toEmail === process.env.EMAIL_USER) {
      console.warn('[sendOTP] Warning: recipient equals SMTP sender; check frontend input.');
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
    if (process.env.NODE_ENV === 'production') {
      try {
        const info = await t.sendMail({ from: fromAddress, to: toEmail, subject, text, html });
        console.log('[sendOTP] Email sent. MessageId:', info?.messageId, 'Response:', info?.response);
        return { success: true, messageId: info?.messageId, response: info?.response };
      } catch (errSend) {
        console.error('[sendOTP] sendMail failed:', errSend?.message || errSend);
        if (errSend?.stack) console.error(errSend.stack);
        return { success: false, error: errSend?.message || 'sendMail failed' };
      }
    } else {
      const sendPromise = t.sendMail({ from: fromAddress, to: toEmail, subject, text, html });
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), sendTimeoutMs));
      const result = await Promise.race([sendPromise, timeoutPromise]);
      if (result && result.timeout) {
        sendPromise.then((info) => {
          console.log('[sendOTP] Email sent (delayed). MessageId:', info?.messageId, 'Response:', info?.response);
        }).catch((err) => {
          console.error('[sendOTP] Email send failed (delayed):', err?.message || err);
          if (err?.stack) console.error(err.stack);
        });
        console.log('[sendOTP] Email sending deferred to background');
        return { success: true, deferred: true };
      }
      console.log('[sendOTP] Email sent. MessageId:', result.messageId, 'Response:', result?.response);
      return { success: true, messageId: result.messageId, response: result?.response };
    }
  } catch (err) {
    console.error('[sendOTP] Error sending email:', err?.message || err);
    if (err?.stack) console.error(err.stack);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

module.exports = { sendOTP, initEmailTransporter };
