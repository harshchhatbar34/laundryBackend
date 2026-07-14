import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { resetPasswordService } from '@/src/modules/auth/auth.service';

// POST /api/auth/reset-password
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return sendError(400, 'token and password are required');
    }

    if (password.length < 6) {
      return sendError(400, 'Password must be at least 6 characters long');
    }

    const result = await resetPasswordService(token, password);
    return sendSuccess(200, result.message);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
}
