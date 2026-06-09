const { validationResult } = require('express-validator');
const { sendOtpService, verifyOtpService, completeProfileService } = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/**
 * POST /api/auth/send-otp
 */
const sendOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, 'Validation failed', errors.array());
    }

    const { mobileNumber } = req.body;
    const result = await sendOtpService(mobileNumber);

    return sendSuccess(res, 200, 'OTP sent successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    console.log('Validation errors:', errors.array());
    if (!errors.isEmpty()) {
      return sendError(res, 400, 'Validation failed', errors.array());
    }

    const { mobileNumber, otp } = req.body;
    const result = await verifyOtpService(mobileNumber, otp);

    const message = result.isNewUser
      ? 'OTP verified. Please complete your profile.'
      : 'Login successful.';

    return sendSuccess(res, 200, message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/complete-profile
 * Protected route — requires JWT
 */
const completeProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, 'Validation failed', errors.array());
    }

    const { name, email } = req.body;
    const user = await completeProfileService(req.user._id, { name, email });

    return sendSuccess(res, 200, 'Profile updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendOtp, verifyOtp, completeProfile };
