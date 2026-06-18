/**
 * Seed Script — bootstraps the first Super Admin account.
 * Run once: node seed.mjs
 *
 * Reads credentials from .env:
 *   SUPERADMIN_EMAIL
 *   SUPERADMIN_PASSWORD
 *   MONGO_URI
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI;
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;

if (!MONGO_URI || !SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
  console.error('❌ Missing MONGO_URI, SUPERADMIN_EMAIL, or SUPERADMIN_PASSWORD in .env');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  tenantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User ?? mongoose.model('User', userSchema);

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: SUPERADMIN_EMAIL });
    if (existing) {
      console.log(`ℹ️  Superadmin already exists: ${SUPERADMIN_EMAIL}`);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
    await User.create({
      name: 'Super Admin',
      email: SUPERADMIN_EMAIL,
      password: hashed,
      role: 'superadmin',
    });

    console.log(`✅ Superadmin created: ${SUPERADMIN_EMAIL}`);
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
