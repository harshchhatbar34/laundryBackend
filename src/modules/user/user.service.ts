import Address from '../user/address.model';
import User from '../user/user.model';
import type { Types } from 'mongoose';

// ─── Profile ────────────────────────────────────────────────────────────────

export const generateReferralCode = async (): Promise<string> => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const exists = await User.exists({ referralCode: code });
    if (!exists) return code;
  }
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const getProfile = async (userId: Types.ObjectId | string) => {
  const user = await User.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  if (!user.referralCode) {
    user.referralCode = await generateReferralCode();
    await user.save();
  }
  return user;
};

export const updateProfile = async (
  userId: Types.ObjectId | string,
  updates: { name?: string; mobileNumber?: string; upiId?: string }
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

export const updateAddress = async (
  addressId: string,
  userId: Types.ObjectId | string,
  updates: {
    label?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    location?: { coordinates: [number, number] };
    isDefault?: boolean;
  }
) => {
  if (updates.isDefault) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  const updateFields: any = { ...updates };
  if (updates.location) {
    updateFields.location = {
      type: 'Point',
      coordinates: updates.location.coordinates,
    };
  }

  const address = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!address) throw Object.assign(new Error('Address not found'), { statusCode: 404 });
  return address;
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

