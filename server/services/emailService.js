require('dotenv').config();
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

function createTransport() {
  if (!nodemailer) return null;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '0', 10);
  if (emailUser && emailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass }
    });
  }
  if (smtpHost && smtpPort && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return null;
}

async function sendEmail(to, subject, text, html) {
  try {
    const from = process.env.FROM_EMAIL || process.env.EMAIL_USER || 'no-reply@localserve';
    const transporter = createTransport();
    if (!transporter) {
      console.log('[EmailService] Transport not configured', { to, subject });
      return { success: false, error: 'Transport not configured' };
    }
    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log('[EmailService] Sent', { messageId: info.messageId, to, subject });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.log('[EmailService] Error', err?.message || err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

module.exports = { sendEmail };
