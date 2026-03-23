require('dotenv').config();
const axios = require('axios');

async function sendEmail(to, subject, text, html) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;

    if (!apiKey || !senderEmail) {
      console.error('[EmailService] Missing BREVO_API_KEY or BREVO_SENDER_EMAIL in environment');
      throw new Error('Brevo credentials not configured');
    }

    const payload = {
      sender: {
        name: 'Home Bell',
        email: senderEmail
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      htmlContent: html,
      textContent: text
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      }
    });

    console.log('[EmailService] Sent', { messageId: response.data.messageId, to, subject });
    return { success: true, messageId: response.data.messageId };
  } catch (err) {
    console.error('[EmailService] Error', err?.response?.data || err?.message || err);
    return { success: false, error: err?.response?.data?.message || err?.message || 'Unknown error' };
  }
}

module.exports = { sendEmail };
