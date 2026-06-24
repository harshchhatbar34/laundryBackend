import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getCustomersByOwner } from '@/src/modules/admin/admin.service';
import type { AuthContext } from '@/types';

// GET /api/owner/customers — list all customers for the owner's tenant
export const GET = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 20;
    const search = url.searchParams.get('search') || undefined;

    const result = await getCustomersByOwner(ctx.user._id, page, limit, search);
    return sendSuccess(200, 'Customers fetched', result);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
