import bcrypt from 'bcryptjs';
import User from '../user/user.model';
import Tenant from '../tenant/tenant.model';
import Order from '../order/order.model';
import type { Types } from 'mongoose';
import { uploadBase64ToS3 } from '@/src/lib/s3';

// ─── Owner CRUD (for SuperAdmin) ─────────────────────────────────────────────

export const getAllOwners = async (page = 1, limit = 20, search?: string, isActive?: boolean) => {
  const skip = (page - 1) * limit;

  const matchStage: any = { role: 'owner' };
  if (typeof isActive === 'boolean') {
    matchStage.isActive = isActive;
  }

  const pipeline: any[] = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'tenants',
        localField: '_id',
        foreignField: 'owner',
        as: 'tenant',
      },
    },
    {
      $unwind: {
        path: '$tenant',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (search) {
    const escaped = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    pipeline.push({
      $match: {
        $or: [
          { name: regex },
          { mobileNumber: regex },
          { 'tenant.laundryName': regex },
          { 'tenant.tenantCode': regex },
        ],
      },
    });
  }

  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            name: 1,
            mobileNumber: 1,
            isActive: 1,
            photo: 1,
            laundryName: { $ifNull: ['$tenant.laundryName', null] },
          },
        },
      ],
    },
  });

  const [result] = await User.aggregate(pipeline);
  const total = result?.metadata[0]?.total ?? 0;
  const owners = result?.data ?? [];

  return { owners, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getOwnerById = async (ownerId: string) => {
  const ownerObj = await User.findOne({ _id: ownerId, role: 'owner' }).select('-password');
  if (!ownerObj) {
    throw Object.assign(new Error('Owner not found'), { statusCode: 404 });
  }

  const tenant = await Tenant.findOne({ owner: ownerId });

  return {
    ...ownerObj.toObject(),
    tenant: tenant ?? null,
  };
};

export const updateOwner = async (
  ownerId: string,
  data: {
    name?: string;
    email?: string;
    mobileNumber?: string;
    photo?: string;
    password?: string;
    laundryName?: string;
    address?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    paymentAmount?: number;
    paymentMode?: 'cash' | 'upi';
    subscription?: 'monthly' | 'yearly' | 'onetime';
  }
) => {
  const owner = await User.findOne({ _id: ownerId, role: 'owner' });
  if (!owner) {
    throw Object.assign(new Error('Owner not found'), { statusCode: 404 });
  }

  if (data.name !== undefined) owner.name = data.name;
  if (data.email !== undefined) {
    if (data.email !== owner.email) {
      const existing = await User.findOne({ email: data.email });
      if (existing) {
        throw Object.assign(new Error('Email already in use'), { statusCode: 409 });
      }
    }
    owner.email = data.email;
  }
  if (data.mobileNumber !== undefined) owner.mobileNumber = data.mobileNumber || null;
  if (data.photo !== undefined) {
    if (data.photo && (data.photo.startsWith('data:') || data.photo.length > 500)) {
      owner.photo = await uploadBase64ToS3(data.photo, 'owners');
    } else {
      owner.photo = data.photo || null;
    }
  }
  if (data.password !== undefined && data.password.trim() !== '') {
    owner.password = await bcrypt.hash(data.password, 10);
  }
  await owner.save();

  const tenant = await Tenant.findOne({ owner: ownerId });
  if (tenant) {
    if (data.laundryName !== undefined) tenant.laundryName = data.laundryName;
    if (data.address !== undefined) tenant.address = data.address || null;
    if (data.landmark !== undefined) tenant.landmark = data.landmark || null;
    if (data.city !== undefined) tenant.city = data.city || null;
    if (data.state !== undefined) tenant.state = data.state || null;
    if (data.pincode !== undefined) tenant.pincode = data.pincode || null;
    if (data.paymentAmount !== undefined) tenant.paymentAmount = data.paymentAmount;
    if (data.paymentMode !== undefined) tenant.paymentMode = data.paymentMode;
    if (data.subscription !== undefined) tenant.subscription = data.subscription;
    await tenant.save();
  }

  // Retrieve fresh data excluding password
  return getOwnerById(ownerId);
};

export const createOwner = async (data: {
  name: string;
  email: string;
  password: string;
  mobileNumber?: string;
  photo?: string;
  laundryName: string;
  address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  paymentAmount: number;
  paymentMode?: 'cash' | 'upi';
  subscription: 'monthly' | 'yearly' | 'onetime';
}) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 409 });

  let photoUrl = data.photo ?? null;
  if (data.photo && (data.photo.startsWith('data:') || data.photo.length > 500)) {
    photoUrl = await uploadBase64ToS3(data.photo, 'owners');
  }

  const hashed = await bcrypt.hash(data.password, 10);
  const owner = await User.create({
    name: data.name,
    email: data.email,
    mobileNumber: data.mobileNumber ?? null,
    photo: photoUrl,
    password: hashed,
    role: 'owner',
  });

  // Auto-generate a unique 8-char alphanumeric tenant code
  const genCode = () =>
    Math.random().toString(36).substring(2, 10).toUpperCase();

  let tenantCode = genCode();
  while (await Tenant.findOne({ tenantCode })) {
    tenantCode = genCode();
  }

  const tenant = await Tenant.create({
    tenantCode,
    owner: owner._id,
    laundryName: data.laundryName,
    address: data.address ?? null,
    landmark: data.landmark ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    pincode: data.pincode ?? null,
    paymentAmount: data.paymentAmount,
    paymentMode: data.paymentMode ?? 'cash',
    subscription: data.subscription,
  });

  return { owner, tenant };
};

export const toggleOwnerActive = async (ownerId: string, isActive: boolean) => {
  const owner = await User.findOneAndUpdate(
    { _id: ownerId, role: 'owner' },
    { $set: { isActive } },
    { new: true }
  );
  if (!owner) throw Object.assign(new Error('Owner not found'), { statusCode: 404 });
  
  // Cascade status to the associated Tenant business
  await Tenant.findOneAndUpdate({ owner: ownerId }, { $set: { isActive } });
  
  return owner;
};

// ─── Tenant Listing (for SuperAdmin) ───────────────────────────────────────────
// Note: Tenant creation is now handled automatically inside createOwner()

export const getAllTenants = async (page = 1, limit = 20, search?: string) => {
  const skip = (page - 1) * limit;

  const pipeline: any[] = [
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerDoc',
      },
    },
    {
      $unwind: {
        path: '$ownerDoc',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (search) {
    const escaped = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    pipeline.push({
      $match: {
        $or: [
          { laundryName: regex },
          { tenantCode: regex },
          { 'ownerDoc.name': regex },
        ],
      },
    });
  }

  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            tenantCode: 1,
            laundryName: 1,
            name: { $ifNull: ['$ownerDoc.name', null] },
          },
        },
      ],
    },
  });

  const [result] = await Tenant.aggregate(pipeline);
  const total = result?.metadata[0]?.total ?? 0;
  const tenants = result?.data ?? [];

  return { tenants, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─── Customer Listing (for SuperAdmin) ──────────────────────────────────────────

export const getAllCustomers = async (page = 1, limit = 20, search?: string, ownerId?: string) => {
  const skip = (page - 1) * limit;
  const matchStage: any = { role: 'customer' };

  if (ownerId) {
    const tenant = await Tenant.findOne({ owner: ownerId });
    if (tenant) {
      matchStage.tenantId = tenant._id;
    } else {
      return { customers: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  const pipeline: any[] = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'tenants',
        localField: 'tenantId',
        foreignField: '_id',
        as: 'tenant',
      },
    },
    {
      $unwind: {
        path: '$tenant',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (search) {
    const escaped = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    pipeline.push({
      $match: {
        $or: [
          { name: regex },
          { email: regex },
          { mobileNumber: regex },
          { 'tenant.laundryName': regex },
        ],
      },
    });
  }

  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            password: 0,
            'tenant.createdAt': 0,
            'tenant.updatedAt': 0,
          },
        },
      ],
    },
  });

  const [result] = await User.aggregate(pipeline);
  const total = result?.metadata[0]?.total ?? 0;
  const customers = result?.data ?? [];

  return { customers, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getCustomerById = async (customerId: string) => {
  const customer = await User.findOne({ _id: customerId, role: 'customer' }).select('-password');
  if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
  
  const tenant = await Tenant.findById(customer.tenantId);
  return {
    ...customer.toObject(),
    tenant: tenant ?? null,
  };
};

// ─── Order Listing (for SuperAdmin) ───────────────────────────────────────────

export const getAllOrders = async (page = 1, limit = 20, search?: string, status?: string, customerId?: string) => {
  const skip = (page - 1) * limit;
  const matchStage: any = {};

  if (status) matchStage.status = status;
  if (customerId) matchStage.customer = customerId;

  if (search) {
    const escaped = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    matchStage.$or = [
      { orderNumber: regex }
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(matchStage)
      .populate('customer', 'name email')
      .populate('branch', 'name city')
      .populate('tenant', 'laundryName tenantCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(matchStage)
  ]);

  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─── Superadmin Dashboard Stats ───────────────────────────────────────────────

export const getSuperadminStats = async () => {
  const [totalOwners, totalCustomers, totalOrders, tenants] = await Promise.all([
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments(),
    Tenant.find({}).select('subscription paymentAmount createdAt'),
  ]);

  let totalRevenue = 0;
  const now = new Date();

  tenants.forEach((tenant) => {
    const amount = tenant.paymentAmount || 0;
    const createdAt = tenant.createdAt || now;
    
    if (tenant.subscription === 'onetime') {
      totalRevenue += amount;
    } else if (tenant.subscription === 'monthly') {
      const msDiff = now.getTime() - createdAt.getTime();
      const daysDiff = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
      const paymentsMade = Math.floor(daysDiff / 30) + 1;
      totalRevenue += amount * paymentsMade;
    } else if (tenant.subscription === 'yearly') {
      const msDiff = now.getTime() - createdAt.getTime();
      const daysDiff = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));
      const paymentsMade = Math.floor(daysDiff / 365) + 1;
      totalRevenue += amount * paymentsMade;
    }
  });

  return {
    totalOwners,
    totalCustomers,
    totalOrders,
    totalRevenue,
  };
};

// ─── Helper CRUD (for Owner) ──────────────────────────────────────────────────

export const getHelpersByOwner = async (ownerId: Types.ObjectId | string, page = 1, limit = 20) => {
  const tenant = await Tenant.findOne({ owner: ownerId });
  if (!tenant) throw Object.assign(new Error('Tenant not found for owner'), { statusCode: 404 });

  const skip = (page - 1) * limit;
  const matchStage = { role: 'helper', tenantId: tenant._id };
  const [helpers, total] = await Promise.all([
    User.find(matchStage).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(matchStage),
  ]);
  return { helpers, total, page, limit, totalPages: Math.ceil(total / limit) };
};


export const getCustomersByOwner = async (ownerId: Types.ObjectId | string, page = 1, limit = 20, search?: string) => {
  const tenant = await Tenant.findOne({ owner: ownerId });
  if (!tenant) throw Object.assign(new Error('Tenant not found for owner'), { statusCode: 404 });

  const skip = (page - 1) * limit;
  const matchStage: any = { role: 'customer', tenantId: tenant._id };

  if (search) {
    const escaped = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    matchStage.$or = [
      { name: regex },
      { email: regex },
      { mobileNumber: regex },
    ];
  }

  const [customers, total] = await Promise.all([
    User.find(matchStage).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(matchStage),
  ]);

  return { customers, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const createHelper = async (ownerId: Types.ObjectId | string, data: { name: string; email: string; password: string }) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 409 });

  const tenant = await Tenant.findOne({ owner: ownerId });
  const tenantId = tenant ? tenant._id : null;

  const hashed = await bcrypt.hash(data.password, 10);
  return User.create({ ...data, password: hashed, role: 'helper', tenantId });
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
