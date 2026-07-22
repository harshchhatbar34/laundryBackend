import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import User from '../user/user.model';
import Tenant from '../tenant/tenant.model';
import type { UserRole } from '@/types';
import { sendWelcomeEmail, sendPasswordResetEmail, sendOtpEmail } from '../../lib/email';

const generateToken = (userId: string, role: UserRole) => {
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as SignOptions['expiresIn'] };
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, options);
};

/** Generate a random 6-digit OTP string */
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/** SHA-256 hash an OTP for safe storage */
const hashOtp = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Register a new customer.
 * Creates user as unverified, sends OTP email.
 * Returns userId + email for the OTP screen (NO jwt token).
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
    throw Object.assign(new Error('Invalid shop code. Please check and try again.'), { statusCode: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (!existing.isEmailVerified) {
      // Already registered but not verified — resend OTP
      const otp = generateOtp();
      existing.otpCode = hashOtp(otp);
      existing.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      await existing.save();
      console.log(`[AUTH_REG] ♻️  Resending OTP for unverified account → to=${email}`);
      sendOtpEmail(email, existing.name, otp).then(sent => {
        console.log(`[AUTH_REG] ${sent ? '✅' : '⚠️ '} OTP resend ${sent ? 'sent' : 'failed'} → to=${email}`);
      }).catch(err => console.error(`[AUTH_REG] ❌ OTP resend error → ${err?.message}`));
      return { userId: String(existing._id), email };
    }
    throw Object.assign(new Error('Email is already in use.'), { statusCode: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    mobileNumber: mobileNumber || null,
    role: 'customer',
    tenantId: tenant._id,
    isEmailVerified: false,
    otpCode: hashOtp(otp),
    otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  console.log(`[AUTH_REG] ✉️  Sending OTP → to=${email} | user=${name} | otp=${otp}`);
  sendOtpEmail(email, name, otp)
    .then((sent) => {
      console.log(`[AUTH_REG] ${sent ? '✅ OTP email sent' : '⚠️  OTP email returned false'} → to=${email}`);
    })
    .catch((err) => {
      console.error(`[AUTH_REG] ❌ OTP email FAILED → to=${email} | ${err?.message}`);
    });

  return { userId: String(user._id), email };
};

/**
 * Verify OTP and complete registration.
 * On success: marks user verified, sends welcome email, returns JWT.
 */
export const verifyOtpService = async (userId: string, otp: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  }
  if (user.isEmailVerified) {
    throw Object.assign(new Error('Email already verified. Please login.'), { statusCode: 400 });
  }
  if (!user.otpCode || !user.otpExpiry) {
    throw Object.assign(new Error('No OTP found. Please register again.'), { statusCode: 400 });
  }
  if (new Date() > user.otpExpiry) {
    throw Object.assign(new Error('OTP has expired. Please request a new one.'), { statusCode: 400 });
  }
  if (hashOtp(otp.trim()) !== user.otpCode) {
    throw Object.assign(new Error('Invalid OTP. Please check and try again.'), { statusCode: 400 });
  }

  // Mark verified and clear OTP
  user.isEmailVerified = true;
  user.otpCode = undefined;
  user.otpExpiry = undefined;
  await user.save();

  // Fetch tenant name for welcome email
  const tenant = await Tenant.findById(user.tenantId);
  const shopName = tenant?.laundryName || process.env.APP_NAME || 'Qwasho';

  console.log(`[AUTH_OTP] ✅ OTP verified → userId=${userId} email=${user.email}`);

  // Send welcome email now that registration is complete
  console.log(`[AUTH_OTP] ✉️  Sending welcome email → to=${user.email}`);
  sendWelcomeEmail(user.email, user.name, shopName)
    .then((sent) => {
      console.log(`[AUTH_OTP] ${sent ? '✅ Welcome email sent' : '⚠️  Welcome email returned false'} → to=${user.email}`);
    })
    .catch((err) => {
      console.error(`[AUTH_OTP] ❌ Welcome email FAILED → to=${user.email} | ${err?.message}`);
    });

  const token = generateToken(String(user._id), 'customer');
  return { token, user };
};

/**
 * Resend OTP to a user who has not yet verified their email.
 */
export const resendOtpService = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found.'), { statusCode: 404 });
  }
  if (user.isEmailVerified) {
    throw Object.assign(new Error('Email already verified.'), { statusCode: 400 });
  }

  const otp = generateOtp();
  user.otpCode = hashOtp(otp);
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  console.log(`[AUTH_OTP] ♻️  Resend OTP → to=${user.email} | otp=${otp}`);
  sendOtpEmail(user.email, user.name, otp)
    .then((sent) => {
      console.log(`[AUTH_OTP] ${sent ? '✅ OTP resent' : '⚠️  OTP resend failed'} → to=${user.email}`);
    })
    .catch((err) => {
      console.error(`[AUTH_OTP] ❌ OTP resend FAILED → ${err?.message}`);
    });

  return { message: 'OTP resent successfully.' };
};

/**
 * Login for all roles.
 */
export const loginService = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  }
  if (!user.isActive) {
    throw Object.assign(new Error('Account has been deactivated.'), { statusCode: 403 });
  }
  if (user.role === 'customer' && !user.isEmailVerified) {
    throw Object.assign(new Error('Please verify your email before logging in.'), { statusCode: 403 });
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  }
  const token = generateToken(String(user._id), user.role);
  return { token, user };
};

/**
 * Forgot password.
 */
export const forgotPasswordService = async (email: string) => {
  const lowercaseEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: lowercaseEmail });
  if (!user) {
    console.log(`[FORGOT_PASSWORD] Non-existent email request: email=${lowercaseEmail}`);
    return { message: 'If the email is registered, you will receive a password reset link.' };
  }
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
  user.resetPasswordToken = hashedToken;
  user.resetPasswordTokenExpiry = tokenExpiry;
  await user.save();
  sendPasswordResetEmail(user.email, user.name, rawToken)
    .catch((err) => console.error(`[FORGOT_PASSWORD] Failed to send email to=${user.email}:`, err));
  return { message: 'If the email is registered, you will receive a password reset link.' };
};

/**
 * Reset password.
 */
export const resetPasswordService = async (rawToken: string, newPassword: string) => {
  if (!rawToken) {
    throw Object.assign(new Error('Token is required.'), { statusCode: 400 });
  }
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordTokenExpiry: { $gt: new Date() },
  });
  if (!user) {
    throw Object.assign(new Error('Invalid or expired password reset token.'), { statusCode: 400 });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiry = undefined;
  await user.save();
  console.log(`[RESET_PASSWORD] Password reset successful: userId=${user._id}`);
  return { message: 'Password reset successfully.' };
};
