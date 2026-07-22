import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { loginService } from '@/src/modules/auth/auth.service';
import { resendOtpService } from '@/src/modules/auth/auth.service';
import User from '@/src/modules/user/user.model';

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

    // Pre-check: if customer exists but is unverified, resend OTP and redirect
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser && existingUser.role === 'customer' && !existingUser.isEmailVerified) {
      // Resend fresh OTP silently
      resendOtpService(String(existingUser._id)).catch(() => {});
      // Return a special response the frontend can detect
      return NextResponse.json(
        {
          success: false,
          message: 'Please verify your email to continue.',
          requiresVerification: true,
          data: { userId: String(existingUser._id), email: existingUser.email },
        },
        { status: 403 }
      );
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
