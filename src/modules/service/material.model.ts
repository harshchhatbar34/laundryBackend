import mongoose, { Schema } from 'mongoose';
import type { IMaterial } from '@/types';

const materialSchema = new Schema<IMaterial>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Material = mongoose.models.Material ?? mongoose.model<IMaterial>('Material', materialSchema);
export default Material;
