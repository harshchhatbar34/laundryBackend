import mongoose, { Schema } from 'mongoose';
import type { IItem } from '@/types';

const itemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Item = mongoose.models.Item ?? mongoose.model<IItem>('Item', itemSchema);
export default Item;
