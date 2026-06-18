import mongoose, { Schema } from 'mongoose';
import type { IUser } from '@/types';

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'owner', 'helper', 'customer'],
      default: 'customer',
    },
    // Only set for customers — permanently binds them to a Tenant/Owner
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent model re-registration during hot reload
const User = mongoose.models.User ?? mongoose.model<IUser>('User', userSchema);
export default User;
