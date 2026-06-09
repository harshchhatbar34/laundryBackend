const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

// Ensure unique combination of material, item, and service
priceSchema.index({ material: 1, item: 1, service: 1 }, { unique: true });

module.exports = mongoose.model('Price', priceSchema);
