import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import { getHelpersByOwner, createHelper, toggleHelperActive } from '@/src/modules/admin/admin.service';
import type { AuthContext } from '@/types';

// GET /api/owner/helpers
export const GET = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const url = new URL(req.url);
    const result = await getHelpersByOwner(
      ctx.user._id,
      Number(url.searchParams.get('page')) || 1,
      Number(url.searchParams.get('limit')) || 20
    );
    return sendSuccess(200, 'Helpers fetched', result);
  } catch (err: unknown) {
    console.error("GET /api/owner/helpers ERROR:", err);
    const e = err as { message?: string; statusCode?: number; stack?: string };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error', [e.stack]);
  }
});

// POST /api/owner/helpers — create a helper account
export const POST = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.email || !body.password) {
      return sendError(400, 'name, email, and password are required');
    }

    const helper = await createHelper(ctx.user._id, body);
    return sendSuccess(201, 'Helper account created', { helper });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// PATCH /api/owner/helpers — toggle helper active status
export const PATCH = withRole('owner')(async (req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const { helperId, isActive } = await req.json();
    if (!helperId || typeof isActive !== 'boolean') {
      return sendError(400, 'helperId and isActive are required');
    }
    const helper = await toggleHelperActive(helperId, isActive);
    return sendSuccess(200, 'Helper status updated', { helper });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
