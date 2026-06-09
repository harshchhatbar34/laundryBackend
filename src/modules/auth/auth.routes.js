const express = require('express');
const router = express.Router();

const { sendOtp, verifyOtp, completeProfile } = require('./auth.controller');
const { sendOtpValidation, verifyOtpValidation, completeProfileValidation } = require('./auth.validation');
const { verifyToken } = require('../../middleware/auth.middleware');
const { otpLimiter } = require('../../middleware/rateLimiter');

// POST /api/auth/send-otp
router.post('/send-otp', otpLimiter, sendOtpValidation, sendOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtpValidation, verifyOtp);

// POST /api/auth/complete-profile  (protected)
router.post('/complete-profile', verifyToken, completeProfileValidation, completeProfile);

module.exports = router;
