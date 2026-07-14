import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { forgotPasswordService } from '@/src/modules/auth/auth.service';

// POST /api/auth/forgot-password
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return sendError(400, 'email is required');
    }

    const result = await forgotPasswordService(email);
    return sendSuccess(200, result.message);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
}
