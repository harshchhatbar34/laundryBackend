import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { createTenant, getAllTenants } from '@/src/modules/admin/admin.service';
import type { AuthContext } from '@/types';

// GET /api/superadmin/tenants — list all tenant codes
export const GET = withRole('superadmin')(async (_req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const tenants = await getAllTenants();
    return sendSuccess(200, 'Tenants fetched', { tenants });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// POST /api/superadmin/tenants — generate a unique tenant code for an owner
// Body: { ownerId }
export const POST = withRole('superadmin')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const { ownerId } = await req.json();
    if (!ownerId) return sendError(400, 'ownerId is required');

    const tenant = await createTenant(ownerId);
    return sendSuccess(201, 'Tenant code generated. Hardcode this into the frontend app.', { tenant });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
