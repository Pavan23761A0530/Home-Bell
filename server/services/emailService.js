require('dotenv').config();
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

let transporter = null;
function initTransporterOnce() {
  if (!nodemailer) return null;
  if (transporter) return transporter;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '0', 10);
  if (emailUser && emailPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass }
    });
    console.log('[EmailService] Transporter initialized: gmail');
    return transporter;
  }
  if (smtpHost && smtpPort && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    console.log('[EmailService] Transporter initialized: smtp', { host: smtpHost, port: smtpPort, secure: smtpPort === 465 });
    return transporter;
  }
  console.log('[EmailService] Transporter not configured. Missing EMAIL_USER/PASS or SMTP settings.');
  return null;
}
initTransporterOnce();

async function sendEmail(to, subject, text, html) {
  try {
    const from = process.env.FROM_EMAIL || process.env.EMAIL_USER || 'no-reply@localserve';
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
