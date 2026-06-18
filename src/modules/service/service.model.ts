import mongoose, { Schema } from 'mongoose';
import type { IService } from '@/types';

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, default: '👕' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Service = mongoose.models.Service ?? mongoose.model<IService>('Service', serviceSchema);
export default Service;
