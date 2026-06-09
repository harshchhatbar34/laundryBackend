const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['percentage', 'flat'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null, // Max cap for percentage coupons
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    usageLimit: {
      type: Number,
      default: 100,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual: isExpired
couponSchema.virtual('isExpired').get(function () {
  return this.expiresAt ? this.expiresAt < new Date() : false;
});

couponSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Coupon', couponSchema);
