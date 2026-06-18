import Branch from './branch.model';
import type { Types } from 'mongoose';

/**
 * Find the nearest branch for a given tenant, using MongoDB $near geospatial query.
 * Returns the branch document (including isLive status).
 * The customer's app has a hardcoded tenantCode — we query only branches of that tenant.
 */
export const findNearestBranch = async (
  tenantId: Types.ObjectId | string,
  lng: number,
  lat: number,
  maxDistanceMeters = 50000 // 50 km default radius
) => {
  const branch = await Branch.findOne({
    tenant: tenantId,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: maxDistanceMeters,
      },
    },
  }).populate('owner', 'name email');

  if (!branch) {
    throw Object.assign(new Error('No branches found near your location.'), { statusCode: 404 });
  }

  return branch;
};

/**
 * Get all branches for an owner (used by Owner panel).
 */
export const getOwnerBranches = async (ownerId: Types.ObjectId | string) =>
  Branch.find({ owner: ownerId }).sort({ createdAt: -1 });

/**
 * Create a new branch for an owner.
 */
export const createBranch = async (
  ownerId: Types.ObjectId | string,
  tenantId: Types.ObjectId | string,
  data: {
    name: string;
    addressLine: string;
    city: string;
    phone: string;
    location: { coordinates: [number, number] };
  }
) => Branch.create({ ...data, owner: ownerId, tenant: tenantId });

/**
 * Update branch details.
 */
export const updateBranch = async (
  branchId: string,
  ownerId: Types.ObjectId | string,
  updates: Partial<{ name: string; addressLine: string; city: string; phone: string }>
) => {
  const branch = await Branch.findOneAndUpdate(
    { _id: branchId, owner: ownerId },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!branch) throw Object.assign(new Error('Branch not found'), { statusCode: 404 });
  return branch;
};

/**
 * Toggle branch LIVE / CLOSED status.
 */
export const toggleBranchStatus = async (
  branchId: string,
  ownerId: Types.ObjectId | string,
  isLive: boolean
) => {
  const branch = await Branch.findOneAndUpdate(
    { _id: branchId, owner: ownerId },
    { $set: { isLive } },
    { new: true }
  );
  if (!branch) throw Object.assign(new Error('Branch not found'), { statusCode: 404 });
  return branch;
};
