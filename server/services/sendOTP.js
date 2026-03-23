require('dotenv').config();
const axios = require('axios');

async function sendOTP(toEmail, otp) {
  try {
    console.log('[sendOTP] Brevo Email function triggered');
    
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;

    if (!apiKey || !senderEmail) {
      console.error('[sendOTP] Missing BREVO_API_KEY or BREVO_SENDER_EMAIL in environment');
      throw new Error('Brevo credentials not configured');
    }

    const payload = {
      sender: {
        name: 'Home Bell',
        email: senderEmail
      },
      to: [
        {
          email: toEmail
        }
      ],
      subject: 'Your OTP Code',
      htmlContent: `<p>Your OTP code is <strong>${otp}</strong>.</p><p>It will expire in 5 minutes.</p>`,
      textContent: `Your OTP code is ${otp}. It will expire in 5 minutes.`
    };

    console.log('[sendOTP] Sending email via Brevo to', toEmail);
    
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      }
    });

    console.log('[sendOTP] Email sent. MessageId:', response.data.messageId);
    return { success: true, messageId: response.data.messageId };
  } catch (err) {
    console.error('[sendOTP] Error sending email:', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.message || err?.message || 'Unknown error' };
  }
}

module.exports = { sendOTP };
