require('dotenv').config();

(async () => {
  const email = `otp_test_${Date.now()}@example.com`;
  const url = `${process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:5002'}/api/auth/register`;
  const payload = { name: 'Signup OTP Test', email, password: 'password123', role: 'customer' };
  console.log('Testing register:', url, payload);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  console.log('Response:', data);
})().catch((e) => {
  console.error('Register test failed:', e?.message || e);
  process.exit(1);
});
