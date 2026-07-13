import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import type { AuthContext } from '@/types';
import { listSubscriptions, createInitialSubscriptionRecord } from '@/src/modules/subscription/subscription.service';

// GET /api/superadmin/subscriptions
export const GET = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const result = await listSubscriptions({
      month:   url.searchParams.get('month')  ? Number(url.searchParams.get('month'))  : undefined,
      year:    url.searchParams.get('year')   ? Number(url.searchParams.get('year'))   : undefined,
      status:  url.searchParams.get('status') ?? undefined,
      type:    url.searchParams.get('type')   ?? undefined,
      search:  url.searchParams.get('search') ?? undefined,
      ownerId: url.searchParams.get('ownerId') ?? undefined,
      page:    Number(url.searchParams.get('page'))  || 1,
      limit:   Number(url.searchParams.get('limit')) || 200,
    });
    return sendSuccess(200, 'Subscriptions fetched', result);
  } catch (err: any) {
    return sendError(err.statusCode ?? 500, err.message ?? 'Internal Server Error');
  }
});

// POST /api/superadmin/subscriptions — manually create a subscription record
export const POST = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();
    const { tenantId, ownerId, subscriptionType, amount, startDate, dueDate } = body;
    if (!tenantId || !ownerId || !subscriptionType || amount == null) {
      return sendError(400, 'tenantId, ownerId, subscriptionType, amount are required');
    }
    if (!['monthly', 'yearly'].includes(subscriptionType)) {
      return sendError(400, 'subscriptionType must be monthly or yearly');
    }
    const record = await createInitialSubscriptionRecord({
      tenantId,
      ownerId,
      subscriptionType,
      amount: Number(amount),
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    return sendSuccess(201, 'Subscription record created', { record });
  } catch (err: any) {
    return sendError(err.statusCode ?? 500, err.message ?? 'Internal Server Error');
  }
});
