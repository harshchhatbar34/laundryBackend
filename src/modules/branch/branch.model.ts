import mongoose, { Schema } from 'mongoose';
import type { IBranch } from '@/types';

const branchSchema = new Schema<IBranch>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    // LIVE = shop is open and accepting orders; CLOSED = not accepting
    isLive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 2dsphere index enables $near geospatial queries for nearest branch
branchSchema.index({ location: '2dsphere' });

const Branch = mongoose.models.Branch ?? mongoose.model<IBranch>('Branch', branchSchema);
export default Branch;
