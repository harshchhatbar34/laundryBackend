import mongoose, { Schema } from 'mongoose';
import type { IOrder } from '@/types';
import { ORDER_STATUSES } from '@/types';

const orderItemSchema = new Schema(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const timelineSchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES },
    note: { type: String, default: '' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, unique: true },
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    helper: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    items: [orderItemSchema],
    address: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    scheduledPickup: {
      date: { type: Date, required: true },
      slot: {
        type: String,
        enum: ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'],
        required: true,
      },
    },
    // Set after pickup; updated if customer reschedules
    scheduledDelivery: { type: Date, default: null },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },
    timeline: [timelineSchema],
    // ── Per-status timestamps — set once when each status is first applied ──
    pendingAt:          { type: Date, default: null },
    acceptedAt:         { type: Date, default: null },
    rejectedAt:         { type: Date, default: null },
    pickupAt:           { type: Date, default: null },
    pickedUpAt:         { type: Date, default: null },
    processingAt:       { type: Date, default: null },
    readyAt:            { type: Date, default: null },
    outForDeliveryAt:   { type: Date, default: null },
    deliveredAt:        { type: Date, default: null },
    completedAt:        { type: Date, default: null },
    cancelledAt:        { type: Date, default: null },
    failedDeliveryAt:   { type: Date, default: null },
    // ────────────────────────────────────────────────────────────────────────
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
    pricing: {
      subtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    // true after helper updates item count at pickup — customer is notified
    billUpdated: { type: Boolean, default: false },
    billConfirmed: { type: Boolean, default: false },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    notes: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

// Auto-generate tenant-scoped order number.
// Format: <4-char tenantCode prefix>-<4-digit per-tenant sequence>
// e.g. ABC1-0001, ABC1-0002 for owner A; XYZ9-0001, XYZ9-0002 for owner B
orderSchema.pre('save', async function (this: any, next) {
  if (!this.orderNumber && this.tenant) {
    try {
      // 1. Get tenant's code for the prefix
      const Tenant = mongoose.model('Tenant');
      const tenant = await Tenant.findById(this.tenant).select('tenantCode').lean();
      const prefix = tenant
        ? String((tenant as any).tenantCode).slice(0, 4).toUpperCase()
        : 'ORD';

      // 2. Count existing orders for THIS tenant only → per-tenant sequence
      const tenantOrderCount = await mongoose.model('Order').countDocuments({ tenant: this.tenant });

      this.orderNumber = `${prefix}-${String(tenantOrderCount + 1).padStart(4, '0')}`;
    } catch {
      // Fallback: timestamp-based to avoid blocking order creation
      this.orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
    }
  }
  next();
});

const Order = mongoose.models.Order ?? mongoose.model<IOrder>('Order', orderSchema);
export default Order;
