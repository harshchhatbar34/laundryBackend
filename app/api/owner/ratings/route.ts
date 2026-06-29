import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import Branch from '@/src/modules/branch/branch.model';
import Rating from '@/src/modules/rating/rating.model';
import type { AuthContext } from '@/types';

// GET /api/owner/ratings — fetch reviews for owner's branches
export const GET = withRole('owner')(async (req: NextRequest, ctx: AuthContext) => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let query: any = {};
    if (branchId) {
      const branch = await Branch.findOne({ _id: branchId, owner: ctx.user._id });
      if (!branch) return sendError(403, 'Branch not found or unauthorized');
      query.branch = branchId;
    } else {
      const branches = await Branch.find({ owner: ctx.user._id }).select('_id');
      const branchIds = branches.map(b => b._id);
      query.branch = { $in: branchIds };
    }

    const skip = (page - 1) * limit;
    const [ratings, total] = await Promise.all([
      Rating.find(query)
        .populate('customer', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Rating.countDocuments(query),
    ]);

    return sendSuccess(200, 'Ratings fetched', {
      ratings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
