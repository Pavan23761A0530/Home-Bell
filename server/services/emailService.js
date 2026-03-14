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
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '0', 10);
  if (emailUser && emailPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      pool: true,
      maxConnections: 2,
      maxMessages: 40,
      connectionTimeout: 15000,
      auth: { user: emailUser, pass: emailPass }
    });
    transporter.verify().then(() => {
      console.log('[EmailService] Transporter verified (gmail)');
    }).catch(err => {
      console.log('[EmailService] Transporter verify failed:', err?.message || err);
    });
    return transporter;
  }
  if (smtpHost && smtpPort && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const secure = smtpPort === 465;
    const cfg = {
      host: smtpHost,
      port: smtpPort,
      secure,
      pool: true,
      maxConnections: 2,
      maxMessages: 40,
      connectionTimeout: 15000,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    };
    if (!secure) {
      cfg.tls = { rejectUnauthorized: false };
    }
    transporter = nodemailer.createTransport(cfg);
    transporter.verify().then(() => {
      console.log('[EmailService] Transporter verified (smtp)');
    }).catch(err => {
      console.log('[EmailService] Transporter verify failed:', err?.message || err);
    });
    return transporter;
  }
  return null;
}

async function sendEmail(to, subject, text, html) {
  try {
    const from = process.env.FROM_EMAIL || process.env.EMAIL_USER || 'no-reply@localserve';
    const t = getTransporter();
    if (!t) {
      console.log('[EmailService] Transport not configured', { to, subject });
      return { success: false, error: 'Transport not configured' };
    }
    const info = await t.sendMail({ from, to, subject, text, html });
    console.log('[EmailService] Sent', { messageId: info.messageId, to, subject });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.log('[EmailService] Error', err?.message || err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

module.exports = { sendEmail };
