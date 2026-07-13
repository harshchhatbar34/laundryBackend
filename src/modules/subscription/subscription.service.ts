import SubscriptionRecord from './subscription.model';
import PaymentRecord from './payment.model';
import Tenant from '../tenant/tenant.model';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const syncTenantSubscriptionRecords = async (tenantId: string) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) return;

  if (tenant.subscription === 'onetime') {
    return;
  }

  // Find latest subscription record for this tenant
  const latestRecord = await SubscriptionRecord.findOne({ tenant: tenant._id })
    .sort({ dueDate: -1 });

  let startDate: Date;
  if (latestRecord) {
    startDate = new Date(latestRecord.dueDate);
  } else {
    startDate = new Date(tenant.createdAt || new Date());
  }

  const now = new Date();
  let currentStart = startDate;
  let currentDue = calculateDueDate(currentStart, tenant.subscription);

  // Generate cycles up to current date (i.e. until the due date is in the future)
  while (currentDue <= now) {
    try {
      await SubscriptionRecord.create({
        tenant: tenant._id,
        owner: tenant.owner,
        subscriptionType: tenant.subscription,
        amount: tenant.paymentAmount,
        startDate: currentStart,
        dueDate: currentDue,
        status: 'pending',
      });
    } catch (err: any) {
      if (err.code !== 11000) throw err;
    }

    currentStart = currentDue;
    currentDue = calculateDueDate(currentStart, tenant.subscription);
  }

  // Also ensure there is always at least one pending record representing the current/next cycle
  const activeRecord = await SubscriptionRecord.findOne({ tenant: tenant._id, status: { $ne: 'paid' } })
    .sort({ dueDate: -1 });

  if (!activeRecord) {
    try {
      await SubscriptionRecord.create({
        tenant: tenant._id,
        owner: tenant.owner,
        subscriptionType: tenant.subscription,
        amount: tenant.paymentAmount,
        startDate: currentStart,
        dueDate: currentDue,
        status: 'pending',
      });
    } catch (err: any) {
      if (err.code !== 11000) throw err;
    }
  }

  // Finally, sync overdue status
  await syncOverdueStatus();
};

export const syncAllTenantsSubscriptionRecords = async () => {
  const tenants = await Tenant.find({ subscription: { $in: ['monthly', 'yearly'] }, isActive: true });
  for (const tenant of tenants) {
    await syncTenantSubscriptionRecords(tenant._id.toString());
  }
};

export function calculateDueDate(from: Date, type: 'monthly' | 'yearly'): Date {
  const d = new Date(from);
  if (type === 'monthly') d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

/** Mark any pending records whose dueDate has passed as 'overdue' in bulk */
export async function syncOverdueStatus(): Promise<void> {
  await SubscriptionRecord.updateMany(
    { status: 'pending', dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } }
  );
}

// ─── Create initial subscription record (called at owner creation) ────────────

export const createInitialSubscriptionRecord = async (opts: {
  tenantId: string;
  ownerId: string;
  subscriptionType: 'monthly' | 'yearly';
  amount: number;
  startDate?: Date;
  dueDate?: Date;
}) => {
  let startDate = opts.startDate;
  let dueDate = opts.dueDate;

  if (dueDate && !startDate) {
    startDate = new Date(dueDate);
    if (opts.subscriptionType === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
  } else if (!dueDate) {
    startDate = startDate ?? new Date();
    dueDate = calculateDueDate(startDate, opts.subscriptionType);
  }

  return SubscriptionRecord.create({
    tenant: opts.tenantId,
    owner: opts.ownerId,
    subscriptionType: opts.subscriptionType,
    amount: opts.amount,
    startDate,
    dueDate: dueDate!,
    status: 'pending',
  });
};

// ─── List subscriptions with filters ─────────────────────────────────────────

export const listSubscriptions = async (opts: {
  month?: number;  // 1-12
  year?: number;
  status?: string;
  type?: string;
  search?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
}) => {
  await syncAllTenantsSubscriptionRecords();
  await syncOverdueStatus();

  const { month, year, status, type, search, ownerId, page = 1, limit = 200 } = opts;
  const skip = (page - 1) * limit;

  const pipeline: any[] = [
    // Join tenant for laundryName + tenantCode
    {
      $lookup: {
        from: 'tenants',
        localField: 'tenant',
        foreignField: '_id',
        as: 'tenantData',
      },
    },
    { $unwind: { path: '$tenantData', preserveNullAndEmptyArrays: true } },
    // Join owner for name + email
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerData',
      },
    },
    { $unwind: { path: '$ownerData', preserveNullAndEmptyArrays: true } },
  ];

  // Build match stage
  const matchStage: any = {};
  if (status && ['pending', 'paid', 'overdue'].includes(status)) matchStage.status = status;
  if (type && ['monthly', 'yearly'].includes(type)) matchStage.subscriptionType = type;
  if (ownerId) matchStage.owner = ownerId;

  // Filter by month+year on dueDate
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    matchStage.dueDate = { $gte: start, $lt: end };
  } else if (year) {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    matchStage.dueDate = { $gte: start, $lt: end };
  }

  // Search by owner name or laundry name
  if (search) {
    const re = new RegExp(search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    matchStage.$or = [
      { 'ownerData.name': re },
      { 'tenantData.laundryName': re },
    ];
  }

  if (Object.keys(matchStage).length > 0) pipeline.push({ $match: matchStage });

  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      data: [
        { $sort: { dueDate: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            subscriptionType: 1,
            amount: 1,
            startDate: 1,
            dueDate: 1,
            status: 1,
            paidMethod: 1,
            paidDate: 1,
            notes: 1,
            createdAt: 1,
            ownerName:    { $ifNull: ['$ownerData.name', '—'] },
            ownerEmail:   { $ifNull: ['$ownerData.email', '—'] },
            ownerPhone:   { $ifNull: ['$ownerData.mobileNumber', null] },
            laundryName:  { $ifNull: ['$tenantData.laundryName', '—'] },
            tenantCode:   { $ifNull: ['$tenantData.tenantCode', '—'] },
            paymentMode:  { $ifNull: ['$tenantData.paymentMode', null] },
          },
        },
      ],
    },
  });

  const [result] = await SubscriptionRecord.aggregate(pipeline);
  const total = result?.metadata[0]?.total ?? 0;
  const records = result?.data ?? [];
  return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getSubscriptionStats = async () => {
  await syncAllTenantsSubscriptionRecords();
  await syncOverdueStatus();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfMonthAfter = new Date(now.getFullYear(), now.getMonth() + 2, 1);

  const [pending, collected, upcoming, overdue] = await Promise.all([
    // Pending this month
    SubscriptionRecord.aggregate([
      { $match: { status: 'pending', dueDate: { $gte: startOfMonth, $lt: startOfNextMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    // Collected this month (paid records)
    PaymentRecord.aggregate([
      { $match: { paidDate: { $gte: startOfMonth, $lt: startOfNextMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    // Upcoming next month
    SubscriptionRecord.aggregate([
      { $match: { status: 'pending', dueDate: { $gte: startOfNextMonth, $lt: startOfMonthAfter } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    // Overdue
    SubscriptionRecord.aggregate([
      { $match: { status: 'overdue' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const [pendingClients, paidClients, overdueClients] = await Promise.all([
    SubscriptionRecord.distinct('owner', { status: 'pending' }),
    SubscriptionRecord.distinct('owner', { status: 'paid', dueDate: { $gte: startOfMonth, $lt: startOfNextMonth } }),
    SubscriptionRecord.distinct('owner', { status: 'overdue' }),
  ]);

  return {
    pendingThisMonth:    { amount: pending[0]?.total ?? 0,   count: pending[0]?.count ?? 0 },
    collectedThisMonth:  { amount: collected[0]?.total ?? 0, count: collected[0]?.count ?? 0 },
    upcomingNextMonth:   { amount: upcoming[0]?.total ?? 0,  count: upcoming[0]?.count ?? 0 },
    overdue:             { amount: overdue[0]?.total ?? 0,   count: overdue[0]?.count ?? 0 },
    pendingClients:  pendingClients.length,
    paidClients:     paidClients.length,
    overdueClients:  overdueClients.length,
  };
};

// ─── Mark as Paid (creates PaymentRecord + next cycle SubscriptionRecord) ─────

export const markSubscriptionPaid = async (subscriptionId: string, paymentData: {
  amount: number;
  paidDate: Date;
  paymentMethod: 'cash' | 'upi';
  notes?: string;
  recordedBy: string;
}) => {
  const sub = await SubscriptionRecord.findById(subscriptionId);
  if (!sub) throw Object.assign(new Error('Subscription record not found'), { statusCode: 404 });
  if (sub.status === 'paid') throw Object.assign(new Error('Already marked as paid'), { statusCode: 400 });

  // Record payment
  const payment = await PaymentRecord.create({
    subscription: sub._id,
    tenant: sub.tenant,
    owner: sub.owner,
    amount: paymentData.amount,
    paidDate: paymentData.paidDate,
    paymentMethod: paymentData.paymentMethod,
    notes: paymentData.notes ?? null,
    recordedBy: paymentData.recordedBy,
  });

  // Mark subscription as paid
  sub.status = 'paid';
  sub.paidMethod = paymentData.paymentMethod;
  sub.paidDate = paymentData.paidDate;
  await sub.save();

  // Auto-create next billing cycle (only for monthly/yearly)
  const nextStart = new Date(sub.dueDate);
  const nextDue = calculateDueDate(nextStart, sub.subscriptionType);
  const nextSub = await SubscriptionRecord.create({
    tenant: sub.tenant,
    owner: sub.owner,
    subscriptionType: sub.subscriptionType,
    amount: sub.amount,
    startDate: nextStart,
    dueDate: nextDue,
    status: 'pending',
  });

  return { subscription: sub, payment, nextSubscription: nextSub };
};

// ─── Get payment history for an owner ────────────────────────────────────────

export const getOwnerPaymentHistory = async (ownerId: string, limit = 20) => {
  return PaymentRecord.find({ owner: ownerId })
    .sort({ paidDate: -1 })
    .limit(limit)
    .populate('subscription', 'subscriptionType dueDate amount')
    .populate('recordedBy', 'name')
    .lean();
};
