const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home',
    },

    buildingVilla: { type: String, required: true, trim: true },
    apartmentNo: { type: String, trim: true, default: '' },
    area: { type: String, required: true, trim: true },
    emirate: { type: String, required: true, trim: true, default: 'Dubai' },
    makani: { type: String, trim: true, default: '' },
    isDefault: {
      type: Boolean,
      default: false,
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Address', addressSchema);
