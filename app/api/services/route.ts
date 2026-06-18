import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { getAllServices } from '@/src/modules/service/service.service';
import type { AuthContext } from '@/types';

// GET /api/services — public list of active services for browsing
export const GET = withAuth(async (_req: NextRequest, _ctx: AuthContext) => {
  try {
    await connectDB();
    const services = await getAllServices(true);
    return sendSuccess(200, 'Services fetched', { services });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
