const crypto = require('crypto');
const logger = require('./logger');

/**
 * Generate a numeric OTP of specified length
 */
const generateOtp = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
};

/**
 * OTP Sender — pluggable provider pattern
 * Set OTP_PROVIDER env var to: mock | msg91 | twilio | fast2sms
 */
const sendOtp = async (mobileNumber, otp) => {
  const provider = process.env.OTP_PROVIDER || 'mock';

  switch (provider) {
    case 'mock':
      logger.info(`[MOCK OTP] Mobile: ${mobileNumber} | OTP: ${otp}`);
      return { success: true, provider: 'mock' };

    case 'msg91':
      // TODO: implement MSG91 integration
      // const response = await axios.post('https://api.msg91.com/api/v5/otp', { ...})
      throw new Error('MSG91 provider not implemented yet');

    case 'twilio':
      // TODO: implement Twilio integration
      throw new Error('Twilio provider not implemented yet');

    case 'fast2sms':
      // TODO: implement Fast2SMS integration
      throw new Error('Fast2SMS provider not implemented yet');

    default:
      throw new Error(`Unknown OTP provider: ${provider}`);
  }
};

module.exports = { generateOtp, sendOtp };
