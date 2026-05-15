import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

export async function seedPlatformAdmin() {
  const email = process.env.SEED_PLATFORM_ADMIN_EMAIL;
  const password = process.env.SEED_PLATFORM_ADMIN_PASSWORD;
  if (!email || !password) return null;
  const existing = await User.findOne({ email });
  if (existing) return existing;
  const hash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    email,
    password: hash,
    name: 'Platform Admin',
    role: 'platform_admin',
    profileComplete: true,
    approved: true,
  });
  console.log('[seed] Platform admin created:', email);
  return admin;
}
