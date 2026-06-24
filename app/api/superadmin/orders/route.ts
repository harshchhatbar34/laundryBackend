import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getAllOrders } from '@/src/modules/admin/admin.service';
import type { AuthContext } from '@/types';

// GET /api/superadmin/orders — list all orders across the platform
export const GET = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 20;
    const search = url.searchParams.get('search') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const customerId = url.searchParams.get('customerId') || undefined;

    const result = await getAllOrders(page, limit, search, status, customerId);
    return sendSuccess(200, 'Orders fetched successfully', result);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
