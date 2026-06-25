import Address from '../user/address.model';
import User from '../user/user.model';
import type { Types } from 'mongoose';

// ─── Profile ────────────────────────────────────────────────────────────────

export const getProfile = async (userId: Types.ObjectId | string) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

export const updateProfile = async (
  userId: Types.ObjectId | string,
  updates: { name?: string }
) => {
  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

// ─── Addresses ──────────────────────────────────────────────────────────────

export const getAddresses = async (userId: Types.ObjectId | string) =>
  Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });

export const addAddress = async (
  userId: Types.ObjectId | string,
  data: {
    label?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    location: { coordinates: [number, number] };
    isDefault?: boolean;
  }
) => {
  // If new address is default, clear existing default
  if (data.isDefault) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }
  return Address.create({ ...data, user: userId });
};

export const deleteAddress = async (
  addressId: string,
  userId: Types.ObjectId | string
) => {
  const address = await Address.findOneAndDelete({ _id: addressId, user: userId });
  if (!address) throw Object.assign(new Error('Address not found'), { statusCode: 404 });
};

export const updatePushToken = async (
  userId: Types.ObjectId | string,
  pushToken: string | null
) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { pushToken } },
    { new: true }
  );
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

