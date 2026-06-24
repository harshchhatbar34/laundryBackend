import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getOwnerById, updateOwner } from '@/src/modules/admin/admin.service';
import type { AuthContext } from '@/types';

// GET /api/superadmin/owners/[id]
export const GET = withRole('superadmin')(
  async (_req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
    try {
      await connectDB();
      const owner = await getOwnerById(ctx.params.id);
      return sendSuccess(200, 'Owner details fetched', { owner });
    } catch (err: unknown) {
      const e = err as { message?: string; statusCode?: number };
      return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
    }
  }
);

// PUT /api/superadmin/owners/[id] — update owner details
export const PUT = withRole('superadmin')(
  async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
    try {
      await connectDB();
      const body = await req.json();

      // Validate subscription option if provided
      if (body.subscription) {
        const validSubscriptions = ['monthly', 'yearly', 'onetime'];
        if (!validSubscriptions.includes(body.subscription)) {
          return sendError(400, `subscription must be one of: ${validSubscriptions.join(', ')}`);
        }
      }

      // Validate paymentMode option if provided
      if (body.paymentMode && !['cash', 'upi'].includes(body.paymentMode)) {
        return sendError(400, 'paymentMode must be either "cash" or "upi"');
      }

      const updated = await updateOwner(ctx.params.id, body);
      return sendSuccess(200, 'Owner details updated successfully', { owner: updated });
    } catch (err: unknown) {
      const e = err as { message?: string; statusCode?: number };
      return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
    }
  }
);
