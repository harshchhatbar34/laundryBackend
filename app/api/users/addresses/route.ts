import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withAuth } from '@/lib/auth';
import { getAddresses, addAddress } from '@/src/modules/user/user.service';
import type { AuthContext } from '@/types';

// GET /api/users/addresses
export const GET = withAuth(async (_req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const addresses = await getAddresses(ctx.user._id);
    return sendSuccess(200, 'Addresses fetched', { addresses });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});

// POST /api/users/addresses
export const POST = withAuth(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.addressLine1 || !body.city || !body.state || !body.pincode || !body.location?.coordinates) {
      return sendError(400, 'addressLine1, city, state, pincode, and location.coordinates are required');
    }

    const address = await addAddress(ctx.user._id, body);
    return sendSuccess(201, 'Address added', { address });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
