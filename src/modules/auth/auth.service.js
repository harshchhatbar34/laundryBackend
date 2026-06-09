const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Otp = require('./otp.model');
const User = require('../user/user.model');
const { generateOtp, sendOtp } = require('../../utils/generateOtp');
const logger = require('../../utils/logger');

const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10);

/**
 * Generate, store (hashed), and send OTP
 */
const sendOtpService = async (mobileNumber) => {
  const otp = generateOtp(6);
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  // Remove any existing OTP for this mobileNumber
  await Otp.deleteMany({ mobileNumber });

  // Check if user exists
  const user = await User.findOne({ mobileNumber });
  const type = user ? 'login' : 'register';

  await Otp.create({ mobileNumber, otp: hashedOtp, type, expiresAt });

  // Send OTP via provider
  await sendOtp(mobileNumber, otp);

  return { type, isNewUser: !user };
};

/**
 * Verify OTP and return JWT token + user info
 */
const verifyOtpService = async (mobileNumber, otp) => {
  console.log(`Verifying OTP for ${mobileNumber}`);
  const otpDoc = await Otp.findOne({ mobileNumber, verified: false });

  if (!otpDoc) {
    throw Object.assign(new Error('OTP not found or already used. Please request a new OTP.'), { statusCode: 400 });
  }

  if (otpDoc.expiresAt < new Date()) {
    await Otp.deleteMany({ mobileNumber });
    throw Object.assign(new Error('OTP has expired. Please request a new one.'), { statusCode: 400 });
  }

  if (otpDoc.attempts >= 5) {
    await Otp.deleteMany({ mobileNumber });
    throw Object.assign(new Error('Too many failed attempts. Please request a new OTP.'), { statusCode: 429 });
  }

  const isMatch = await bcrypt.compare(otp, otpDoc.otp);
  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    throw Object.assign(new Error(`Incorrect OTP. ${5 - otpDoc.attempts} attempts remaining.`), { statusCode: 400 });
  }

  // Mark OTP as verified
  otpDoc.verified = true;
  await otpDoc.save();

  // Check if user exists
  let user = await User.findOne({ mobileNumber });
  const isNewUser = !user;

  if (!isNewUser) {
    // Existing user — issue token
    const token = generateToken(user._id);
    logger.info(`User logged in: ${mobileNumber}`);
    return { isNewUser: false, token, user };
  }

  // New user — create with minimal info
  user = await User.create({ mobileNumber });
  const token = generateToken(user._id);
  logger.info(`New user registered: ${mobileNumber}`);
  return { isNewUser: true, token, user };
};

/**
 * Complete profile for new users
 */
const completeProfileService = async (userId, { name, email }) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { name, email, isProfileComplete: true },
    { new: true, runValidators: true }
  );
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = { sendOtpService, verifyOtpService, completeProfileService };
