import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { loginService } from '@/src/modules/auth/auth.service';

// POST /api/auth/login — Mobile app only.
// Only superadmin is blocked here — must use /api/admin-auth/login
const MOBILE_ALLOWED_ROLES = ['customer', 'helper', 'owner'];

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return sendError(400, 'email and password are required');
    }

    const result = await loginService(email, password);

    // Block privileged roles from using the mobile endpoint
    if (!MOBILE_ALLOWED_ROLES.includes(result.user.role)) {
      return sendError(403, 'Access denied. Please use the admin portal to sign in.');
    }

    return sendSuccess(200, 'Login successful', result);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
}
