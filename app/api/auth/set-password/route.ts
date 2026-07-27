import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import User from '@/src/modules/user/user.model';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// POST /api/auth/set-password
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return sendError(400, 'Token and password are required');
    }

    if (password.length < 8) {
      return sendError(400, 'Password must be at least 8 characters long');
    }

    const { resetPasswordService } = await import('@/src/modules/auth/auth.service');
    const result = await resetPasswordService(token, password);
    return sendSuccess(200, result.message);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
}
