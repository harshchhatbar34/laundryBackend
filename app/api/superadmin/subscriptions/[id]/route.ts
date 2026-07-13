import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import type { AuthContext } from '@/types';
import SubscriptionRecord from '@/src/modules/subscription/subscription.model';
import { markSubscriptionPaid } from '@/src/modules/subscription/subscription.service';

// GET /api/superadmin/subscriptions/[id]
export const GET = withRole('superadmin')(async (_req: NextRequest, ctx: AuthContext<{ id: string }>) => {
  try {
    await connectDB();
    const sub = await SubscriptionRecord.findById(ctx.params.id)
      .populate('tenant', 'laundryName tenantCode paymentMode')
      .populate('owner', 'name email mobileNumber')
      .lean();
    if (!sub) return sendError(404, 'Subscription record not found');
    return sendSuccess(200, 'Subscription fetched', { subscription: sub });
  } catch (err: any) {
    return sendError(err.statusCode ?? 500, err.message ?? 'Internal Server Error');
  }
});

// PATCH /api/superadmin/subscriptions/[id]
// body: { action: 'markPaid', amount, paidDate, paymentMethod, notes }
//    OR { notes } to just update notes/amount
export const PATCH = withRole('superadmin')(async (req: NextRequest, ctx: AuthContext<{ id: string }>) => {
  try {
    await connectDB();
    const body = await req.json();
    const adminId = (ctx as any).user._id?.toString() ?? '';

    if (body.action === 'markPaid') {
      const { amount, paidDate, paymentMethod, notes } = body;
      if (!paidDate || !paymentMethod) {
        return sendError(400, 'paidDate and paymentMethod are required');
      }
      const result = await markSubscriptionPaid(ctx.params.id, {
        amount: Number(amount),
        paidDate: new Date(paidDate),
        paymentMethod,
        notes,
        recordedBy: adminId,
      });
      return sendSuccess(200, 'Subscription marked as paid and next cycle created', result);
    }

    // General update (notes, amount)
    const allowed = ['notes', 'amount', 'dueDate', 'startDate'];
    const updates: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    const updated = await SubscriptionRecord.findByIdAndUpdate(
      ctx.params.id,
      { $set: updates },
      { new: true }
    );
    if (!updated) return sendError(404, 'Subscription record not found');
    return sendSuccess(200, 'Subscription updated', { subscription: updated });
  } catch (err: any) {
    return sendError(err.statusCode ?? 500, err.message ?? 'Internal Server Error');
  }
});

// DELETE /api/superadmin/subscriptions/[id]
export const DELETE = withRole('superadmin')(async (_req: NextRequest, ctx: AuthContext<{ id: string }>) => {
  try {
    await connectDB();
    const deleted = await SubscriptionRecord.findByIdAndDelete(ctx.params.id);
    if (!deleted) return sendError(404, 'Subscription record not found');
    return sendSuccess(200, 'Subscription record deleted', {});
  } catch (err: any) {
    return sendError(err.statusCode ?? 500, err.message ?? 'Internal Server Error');
  }
});
