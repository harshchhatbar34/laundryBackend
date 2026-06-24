import mongoose, { Schema } from 'mongoose';
import type { IService } from '@/types';

const serviceSchema = new Schema<IService>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, default: '👕' },
    price: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.index({ tenant: 1, name: 1 });

const Service = mongoose.models.Service ?? mongoose.model<IService>('Service', serviceSchema);
export default Service;
