import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getCustomerById } from '@/src/modules/admin/admin.service';
import type { AuthContext } from '@/types';

// GET /api/superadmin/customers/[id]
export const GET = withRole('superadmin')(
  async (_req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
    try {
      await connectDB();
      const customer = await getCustomerById(ctx.params.id);
      return sendSuccess(200, 'Customer details fetched', { customer });
    } catch (err: unknown) {
      const e = err as { message?: string; statusCode?: number };
      return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
    }
  }
);
