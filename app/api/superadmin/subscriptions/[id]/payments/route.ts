import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import type { AuthContext } from '@/types';
import PaymentRecord from '@/src/modules/subscription/payment.model';

// GET /api/superadmin/subscriptions/[id]/payments — history for a specific subscription record
export const GET = withRole('superadmin')(async (_req: NextRequest, ctx: AuthContext<{ id: string }>) => {
  try {
    await connectDB();
    const payments = await PaymentRecord.find({ subscription: ctx.params.id })
      .sort({ paidDate: -1 })
      .populate('recordedBy', 'name')
      .lean();
    return sendSuccess(200, 'Payment history fetched', { payments });
  } catch (err: any) {
    return sendError(err.statusCode ?? 500, err.message ?? 'Internal Server Error');
  }
});
