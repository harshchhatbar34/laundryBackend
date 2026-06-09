const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../user/user.model');
const logger = require('../../utils/logger');

const registerService = async ({ name, email, mobileNumber, password }) => {
  // Check if user exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw Object.assign(new Error('Email is already in use.'), { statusCode: 400 });
  }

  const existingMobile = await User.findOne({ mobileNumber });
  if (existingMobile) {
    throw Object.assign(new Error('Mobile number is already in use.'), { statusCode: 400 });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    name,
    email,
    mobileNumber,
    password: hashedPassword,
    isProfileComplete: true,
  });

  const token = generateToken(user._id);
  logger.info(`New user registered: ${email}`);

  // Don't return password
  const userResponse = user.toObject();
  delete userResponse.password;

  return { token, user: userResponse };
};

const loginService = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  }

  const token = generateToken(user._id);
  logger.info(`User logged in: ${email}`);

  const userResponse = user.toObject();
  delete userResponse.password;

  return { token, user: userResponse };
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = { registerService, loginService };
