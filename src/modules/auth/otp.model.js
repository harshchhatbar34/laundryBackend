const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['login', 'register'],
      default: 'login',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index — MongoDB auto-deletes expired docs
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Otp', otpSchema);
