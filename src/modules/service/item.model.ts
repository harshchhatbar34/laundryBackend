import mongoose, { Schema } from 'mongoose';
import type { IItem } from '@/types';

const itemSchema = new Schema<IItem>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

itemSchema.index({ tenant: 1, name: 1 });

const Item = mongoose.models.Item ?? mongoose.model<IItem>('Item', itemSchema);
export default Item;
