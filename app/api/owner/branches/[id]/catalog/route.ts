import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { sendSuccess, sendError } from '@/lib/apiResponse';
import { withRole } from '@/lib/auth';
import Branch from '@/src/modules/branch/branch.model';
import Service from '@/src/modules/service/service.model';
import Material from '@/src/modules/service/material.model';
import Item from '@/src/modules/service/item.model';
import type { AuthContext } from '@/types';

// PATCH /api/owner/branches/[id]/catalog — toggle item/service availability for this branch
export const PATCH = withRole('owner')(async (req: NextRequest, ctx: AuthContext & { params: { id: string } }) => {
  try {
    await connectDB();
    const branchId = ctx.params.id;
    const userId = ctx.user._id;

    // Verify branch ownership
    const branch = await Branch.findOne({ _id: branchId, owner: userId });
    if (!branch) {
      return sendError(404, 'Branch not found or unauthorized');
    }

    const { type, itemId, isAvailable } = await req.json();
    if (!type || !itemId || typeof isAvailable !== 'boolean') {
      return sendError(400, 'type, itemId, and isAvailable are required');
    }

    let Model;
    if (type === 'service') Model = Service;
    else if (type === 'material') Model = Material;
    else if (type === 'item') Model = Item;
    else {
      return sendError(400, 'Invalid type, must be service, material, or item');
    }

    let updateQuery: any = {};
    if (isAvailable) {
      updateQuery = { $addToSet: { branches: branchId } };
    } else {
      updateQuery = { 
        $pull: { branches: branchId },
        $set: { isAllBranches: false } // no longer active for "All" if manually disabled in one
      };
    }

    const doc = await Model.findOneAndUpdate(
      { _id: itemId, tenant: branch.tenant },
      updateQuery,
      { new: true }
    );

    if (!doc) {
      return sendError(404, `${type} not found`);
    }

    return sendSuccess(200, `${type} availability updated`, { item: doc });
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    return sendError(e.statusCode ?? 500, e.message ?? 'Internal Server Error');
  }
});
