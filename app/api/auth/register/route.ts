import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { registerCustomer, loginService } from '@/src/modules/auth/auth.service';

// POST /api/auth/register
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password, tenantCode, mobileNumber } = body;

    if (!name || !email || !password || !tenantCode) {
      return sendError(400, 'name, email, password, and tenantCode are required');
    }

    const result = await registerCustomer({ name, email, password, tenantCode, mobileNumber });
    return sendSuccess(201, 'Account created successfully', result);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
}
