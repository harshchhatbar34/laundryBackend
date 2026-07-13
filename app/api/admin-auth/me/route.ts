import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { jwtVerify } from 'jose';
import User from '@/src/modules/user/user.model';

// GET /api/admin-auth/me — returns the logged-in superadmin's profile
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get('admin_token')?.value;
    if (!token) return sendError(401, 'Not authenticated');

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const user = await User.findById(payload.id).select('-password');
    if (!user || user.role !== 'superadmin') return sendError(403, 'Forbidden');

    return sendSuccess(200, 'Profile fetched', { user });
  } catch {
    return sendError(401, 'Invalid or expired session');
  }
}

// PATCH /api/admin-auth/me — updates the logged-in superadmin's profile (name, upiId)
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get('admin_token')?.value;
    if (!token) return sendError(401, 'Not authenticated');

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const user = await User.findById(payload.id);
    if (!user || user.role !== 'superadmin') return sendError(403, 'Forbidden');

    const body = await req.json();
    if (body.name !== undefined) user.name = body.name;
    if (body.upiId !== undefined) user.upiId = body.upiId || null;

    await user.save();

    return sendSuccess(200, 'Profile updated successfully', { user });
  } catch (err: any) {
    return sendError(500, err.message || 'Internal Server Error');
  }
}

