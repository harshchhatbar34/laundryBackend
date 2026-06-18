import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getOwnerBranches, createBranch } from '@/src/modules/branch/branch.service';
import Tenant from '@/src/modules/tenant/tenant.model';
import type { AuthContext } from '@/types';

// GET /api/owner/branches — list owner's branches
export const GET = withRole('owner')(async (_req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const branches = await getOwnerBranches(ctx.user._id);
    return sendSuccess(200, 'Branches fetched', { branches });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// POST /api/owner/branches — create a new branch
export const POST = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.addressLine || !body.city || !body.phone || !body.location?.coordinates) {
      return sendError(400, 'name, addressLine, city, phone, and location.coordinates are required');
    }

    const tenant = await Tenant.findOne({ owner: ctx.user._id });
    if (!tenant) return sendError(403, 'No tenant found for this owner. Contact superadmin.');

    const branch = await createBranch(ctx.user._id, tenant._id, body);
    return sendSuccess(201, 'Branch created', { branch });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
