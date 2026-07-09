import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getOwnerById, updateOwner } from '@/src/modules/admin/admin.service';
import type { AuthContext } from '@/types';

// GET /api/superadmin/owners/[id]
export const GET = withRole('superadmin')(async (_req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const id = (ctx as any).params?.id;
    if (!id) return sendError(400, 'Owner id is required');
    const owner = await getOwnerById(id);
    return sendSuccess(200, 'Owner fetched', owner);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// PATCH /api/superadmin/owners/[id] — update owner + tenant details
export const PATCH = withRole('superadmin')(async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const id = (ctx as any).params?.id;
    if (!id) return sendError(400, 'Owner id is required');
    const data = await req.json();
    const updated = await updateOwner(id, data);
    return sendSuccess(200, 'Owner updated', updated);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
