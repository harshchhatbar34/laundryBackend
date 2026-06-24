import mongoose, { Schema } from 'mongoose';
import type { IMaterial } from '@/types';

const materialSchema = new Schema<IMaterial>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

materialSchema.index({ tenant: 1, name: 1 });

const Material = mongoose.models.Material ?? mongoose.model<IMaterial>('Material', materialSchema);
export default Material;
