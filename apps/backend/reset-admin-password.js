#!/usr/bin/env node
/**
 * Reset admin password using ADMIN_SEED_PASSWORD from .env.
 * Run from apps/backend: node reset-admin-password.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI;
const password = process.env.ADMIN_SEED_PASSWORD;

if (!uri) {
  console.error('MONGODB_URI is required. Set it in .env');
  process.exit(1);
}
if (!password) {
  console.error('ADMIN_SEED_PASSWORD is required. Add it to .env and run again.');
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri);
  const users = mongoose.connection.db.collection('users');
  const user = await users.findOne({ email: 'admin@musaed.com' });
  if (!user) {
    console.error('Admin user (admin@musaed.com) not found. Run npm run seed first.');
    await mongoose.disconnect();
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  const result = await users.updateOne(
    { email: 'admin@musaed.com' },
    { $set: { passwordHash: hash } },
  );
  if (result.matchedCount === 0 || result.modifiedCount === 0) {
    console.error('Update failed: no document matched or modified.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log('Admin password reset. Login: admin@musaed.com');
  await mongoose.disconnect();
}
run().catch((err) => {
  console.error('Failed:', err.message ?? err);
  process.exit(1);
});
