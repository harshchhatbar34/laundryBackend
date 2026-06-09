const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'pending',       // Order placed, awaiting confirmation
  'confirmed',     // Admin confirmed the order
  'pickup',        // Out for pickup
  'received',      // Clothes received at facility
  'processing',    // Washing/ironing in progress
  'ready',         // Ready for delivery
  'out_delivery',  // Out for delivery
  'delivered',     // Delivered to customer
  'cancelled',     // Cancelled
];

const orderItemSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  status: { type: String, enum: ORDER_STATUSES },
  note: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    weightKg: {
      type: Number,
      default: 0,
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    scheduledPickup: {
      date: { type: Date, required: true },
      slot: {
        type: String,
        enum: ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'],
        required: true,
      },
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },
    timeline: [timelineSchema],
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    pricing: {
      subtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cod'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Auto-generate order number before save
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `LND-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
