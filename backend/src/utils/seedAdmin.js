// backend/src/utils/seedAdmin.js
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const bcrypt = require('bcrypt');

async function seed() {
  await connectDB(process.env.MONGO_URI);
  const email = 'admin@gmail.com';
  const exists = await User.findOne({ email });
  if (exists) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }
  const passwordHash = await bcrypt.hash('admin', 10);
  const user = await User.create({ name: 'Admin', email, passwordHash, role: 'admin' });
  console.log('Created admin:', user.email, 'password: adminpass');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
