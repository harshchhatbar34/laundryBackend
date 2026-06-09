const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

/**
 * General API rate limiter — 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 429, 'Too many requests, please try again later.');
  },
});

/**
 * Strict OTP limiter — 5 requests per 15 minutes per IP
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 429, 'Too many OTP requests. Please wait before trying again.');
  },
});

module.exports = { generalLimiter, otpLimiter };
