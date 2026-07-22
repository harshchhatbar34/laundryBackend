import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { verifyOtpService } from '@/src/modules/auth/auth.service';

// POST /api/auth/verify-otp
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { userId, otp } = await req.json();
    if (!userId || !otp) {
      return sendError(400, 'userId and otp are required');
    }
    const result = await verifyOtpService(userId, otp);
    return sendSuccess(200, 'Email verified successfully', result);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
}
