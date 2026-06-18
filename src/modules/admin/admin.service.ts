import bcrypt from 'bcryptjs';
import User from '../user/user.model';
import Tenant from '../tenant/tenant.model';
import Order from '../order/order.model';
import type { Types } from 'mongoose';

// ─── Owner CRUD (for SuperAdmin) ─────────────────────────────────────────────

export const getAllOwners = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [owners, total] = await Promise.all([
    User.find({ role: 'owner' }).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments({ role: 'owner' }),
  ]);
  return { owners, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const createOwner = async (data: { name: string; email: string; password: string }) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 409 });

  const hashed = await bcrypt.hash(data.password, 10);
  const owner = await User.create({ ...data, password: hashed, role: 'owner' });
  return owner;
};

export const toggleOwnerActive = async (ownerId: string, isActive: boolean) => {
  const owner = await User.findOneAndUpdate(
    { _id: ownerId, role: 'owner' },
    { $set: { isActive } },
    { new: true }
  );
  if (!owner) throw Object.assign(new Error('Owner not found'), { statusCode: 404 });
  return owner;
};

// ─── Tenant Code Management (for SuperAdmin) ──────────────────────────────────

export const createTenant = async (ownerId: string) => {
  const owner = await User.findOne({ _id: ownerId, role: 'owner' });
  if (!owner) throw Object.assign(new Error('Owner not found'), { statusCode: 404 });

  // Generate a unique 8-char alphanumeric code
  const genCode = () =>
    Math.random().toString(36).substring(2, 10).toUpperCase();

  let tenantCode = genCode();
  // Retry on collision
  while (await Tenant.findOne({ tenantCode })) {
    tenantCode = genCode();
  }

  return Tenant.create({ tenantCode, owner: ownerId });
};

export const getAllTenants = async () =>
  Tenant.find().populate('owner', 'name email').sort({ createdAt: -1 });

// ─── Superadmin Dashboard Stats ───────────────────────────────────────────────

export const getSuperadminStats = async () => {
  const [totalOwners, totalCustomers, totalOrders, revenueAgg] = await Promise.all([
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'rejected'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]),
  ]);

  return {
    totalOwners,
    totalCustomers,
    totalOrders,
    totalRevenue: revenueAgg[0]?.total ?? 0,
  };
};

// ─── Helper CRUD (for Owner) ──────────────────────────────────────────────────

export const getHelpersByOwner = async (ownerId: Types.ObjectId | string, page = 1, limit = 20) => {
  // Helpers don't have tenantId — we find helpers linked via tenant/branch ownership
  // For simplicity: Owner manages helpers directly (they share the same tenant space)
  const skip = (page - 1) * limit;
  const [helpers, total] = await Promise.all([
    User.find({ role: 'helper' }).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments({ role: 'helper' }),
  ]);
  return { helpers, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const createHelper = async (data: { name: string; email: string; password: string }) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 409 });

  const hashed = await bcrypt.hash(data.password, 10);
  return User.create({ ...data, password: hashed, role: 'helper' });
};

export const toggleHelperActive = async (helperId: string, isActive: boolean) => {
  const helper = await User.findOneAndUpdate(
    { _id: helperId, role: 'helper' },
    { $set: { isActive } },
    { new: true }
  );
  if (!helper) throw Object.assign(new Error('Helper not found'), { statusCode: 404 });
  return helper;
};
