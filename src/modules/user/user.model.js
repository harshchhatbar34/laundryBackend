const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['user', 'driver', 'admin'],
      default: 'user',
    },
    // Driver-specific fields
    isOnline: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    vehicleType: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    totalDeliveries: { type: Number, default: 0 },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('User', userSchema);
