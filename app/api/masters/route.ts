import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import User from '@/src/modules/user/user.model';
import { getOwnerMaterials, getOwnerItems } from '@/src/modules/service/service.service';
import type { AuthContext } from '@/types';

// GET /api/masters — Fetch active materials and items for the authenticated customer's tenant
export const GET = withAuth(async (_req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    
    // Find customer to get their tenantId
    const userDoc = await User.findById(ctx.user._id);
    if (!userDoc) {
      return sendError(404, 'User not found');
    }
    
    if (!userDoc.tenantId) {
      return sendError(400, 'User is not associated with any tenant');
    }

    const [materials, items] = await Promise.all([
      getOwnerMaterials(userDoc.tenantId, true),
      getOwnerItems(userDoc.tenantId, true),
    ]);

    return sendSuccess(200, 'Masters fetched', { materials, items });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
