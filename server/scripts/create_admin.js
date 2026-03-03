const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const run = async () => {
  try {
    await connectDB();

    const [, , argEmail, argPassword, ...nameParts] = process.argv;
    const rawEmail = argEmail || process.env.ADMIN_EMAIL || '';
    const email = (rawEmail || '').trim();
    const password = argPassword || process.env.ADMIN_PASSWORD;
    const name = nameParts.length ? nameParts.join(' ') : (process.env.ADMIN_NAME || 'Admin User');

    if (!email || !password) {
      console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables');
      process.exit(1);
    }

    let user = await User.findOne({ email });
    if (user) {
      user.name = name;
      user.role = 'admin';
      user.password = password;
      await user.save();
      console.log(`Admin updated: ${email}`);
    } else {
      user = await User.create({
        name,
        email,
        password,
        role: 'admin'
      });
      console.log(`Admin created: ${email}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Admin creation failed:', err.message);
    process.exit(1);
  }
};

run();
