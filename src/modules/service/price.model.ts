import mongoose, { Schema } from 'mongoose';
import type { IPrice } from '@/types';

const priceSchema = new Schema<IPrice>(
  {
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Unique combo: service + material + item
priceSchema.index({ service: 1, material: 1, item: 1 }, { unique: true });

const Price = mongoose.models.Price ?? mongoose.model<IPrice>('Price', priceSchema);
export default Price;
