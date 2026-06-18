import mongoose, { Schema } from 'mongoose';
import type { IRating } from '@/types';

const ratingSchema = new Schema<IRating>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: '', trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const Rating = mongoose.models.Rating ?? mongoose.model<IRating>('Rating', ratingSchema);
export default Rating;
