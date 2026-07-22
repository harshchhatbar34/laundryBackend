import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { resendOtpService } from '@/src/modules/auth/auth.service';

// POST /api/auth/resend-otp
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId } = await req.json();
    if (!userId) {
      return sendError(400, 'userId is required');
    }
    const result = await resendOtpService(userId);
    return sendSuccess(200, result.message, null);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
}
