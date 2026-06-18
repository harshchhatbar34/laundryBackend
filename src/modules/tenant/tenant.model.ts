import mongoose, { Schema } from 'mongoose';
import type { ITenant } from '@/types';

const tenantSchema = new Schema<ITenant>(
  {
    // Unique code hardcoded into each white-label app build
    tenantCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    // The Laundry Owner this tenant code belongs to
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Tenant = mongoose.models.Tenant ?? mongoose.model<ITenant>('Tenant', tenantSchema);
export default Tenant;
