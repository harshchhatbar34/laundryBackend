import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loginService } from '@/src/modules/auth/auth.service';
import { SignJWT } from 'jose';

// POST /api/admin-auth/login
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    const { user } = await loginService(email, password);

    if (user.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Superadmin credentials required.' },
        { status: 403 }
      );
    }

    // Sign a jose-compatible JWT (same format the middleware verifies)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ id: String(user._id), role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret);

    const res = NextResponse.json({ success: true, message: 'Login successful' });
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    return res;
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return NextResponse.json(
      { success: false, message: e.message ?? 'Internal Server Error' },
      { status: e.statusCode ?? 500 }
    );
  }
}
