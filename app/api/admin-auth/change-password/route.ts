import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { jwtVerify } from 'jose';
import User from '@/src/modules/user/user.model';
import bcrypt from 'bcryptjs';

// PATCH /api/admin-auth/change-password
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get('admin_token')?.value;
    if (!token) return sendError(401, 'Not authenticated');

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const user = await User.findById(payload.id);
    if (!user || user.role !== 'superadmin') return sendError(403, 'Forbidden');

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return sendError(400, 'currentPassword and newPassword are required');
    if (newPassword.length < 8) return sendError(400, 'New password must be at least 8 characters');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return sendError(401, 'Current password is incorrect');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return sendSuccess(200, 'Password updated successfully');
  } catch {
    return sendError(500, 'Internal Server Error');
  }
}
