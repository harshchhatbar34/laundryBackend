import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import User from '../user/user.model';
import Tenant from '../tenant/tenant.model';
import type { UserRole } from '@/types';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../../lib/email';

const generateToken = (userId: string, role: UserRole) => {
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as SignOptions['expiresIn'] };
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, options);
};

/**
 * Register a new customer.
 * Requires a tenantCode to bind the customer to a Laundry Owner.
 */
export const registerCustomer = async (body: {
  name: string;
  email: string;
  password: string;
  tenantCode: string;
  mobileNumber?: string;
}) => {
  const { name, email, password, tenantCode, mobileNumber } = body;

  // Validate tenant code
  const tenant = await Tenant.findOne({ tenantCode: tenantCode.toUpperCase(), isActive: true });
  if (!tenant) {
    throw Object.assign(new Error('Invalid app code. Please use the correct app for your laundry service.'), { statusCode: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw Object.assign(new Error('Email is already in use.'), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    mobileNumber: mobileNumber || null,
    role: 'customer',
    tenantId: tenant._id,
  });

  // Send welcome email asynchronously so the registration endpoint returns instantly
  sendWelcomeEmail(user.email, user.name, tenant.laundryName || 'Qwasho')
    .catch((err) => console.error('[AUTH_REG] Error sending welcome email asynchronously:', err));

  const token = generateToken(String(user._id), 'customer');
  return { token, user };
};

/**
 * Login for all roles (customer, helper, owner, superadmin).
 * Returns role in JWT so frontend can route appropriately.
 */
export const loginService = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  }

  if (!user.isActive) {
    throw Object.assign(new Error('Account has been deactivated.'), { statusCode: 403 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  }

  const token = generateToken(String(user._id), user.role);
  return { token, user };
};

/**
 * Handle forgot password request:
 * - Checks if user exists.
 * - Generates secure random token.
 * - Stores SHA-256 hashed token with 15-minute expiry in DB.
 * - Sends password reset email.
 * - Returns success message regardless of existence (prevents user enumeration).
 */
export const forgotPasswordService = async (email: string) => {
  const lowercaseEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: lowercaseEmail });

  if (!user) {
    console.log(`[FORGOT_PASSWORD] Non-existent email request: email=${lowercaseEmail}`);
    // Return success to prevent enumeration
    return { message: 'If the email is registered, you will receive a password reset link.' };
  }

  // Generate 32-byte secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Hash the token using SHA-256 to save to DB (prevents database leak vulnerability)
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Set expiry to 15 minutes from now
  const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordTokenExpiry = tokenExpiry;
  await user.save();

  // Send the reset email asynchronously
  sendPasswordResetEmail(user.email, user.name, rawToken)
    .catch((err) => console.error(`[FORGOT_PASSWORD] Failed to send email to=${user.email}:`, err));

  return { message: 'If the email is registered, you will receive a password reset link.' };
};

/**
 * Handle password reset using the raw token:
 * - Hashes the incoming raw token and finds user with valid non-expired token.
 * - Hashes the new password and updates user.
 * - Clears the reset token and expiry fields.
 */
export const resetPasswordService = async (rawToken: string, newPassword: string) => {
  if (!rawToken) {
    throw Object.assign(new Error('Token is required.'), { statusCode: 400 });
  }

  // Hash incoming raw token to match against DB value
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw Object.assign(new Error('Invalid or expired password reset token.'), { statusCode: 400 });
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiry = undefined;
  await user.save();

  console.log(`[RESET_PASSWORD] Password reset successful: userId=${user._id}`);
  return { message: 'Password reset successfully.' };
};
