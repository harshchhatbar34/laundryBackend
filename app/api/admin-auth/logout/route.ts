import { NextResponse } from 'next/server';

// POST /api/admin-auth/logout
export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out' });
  res.cookies.set('admin_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  return res;
}
