import mongoose from 'mongoose';
import Tenant from '@/src/modules/tenant/tenant.model';

export const getTenantId = async (userId: string, role: string): Promise<mongoose.Types.ObjectId> => {
  if (role === 'owner') {
    const tenant = await Tenant.findOne({ owner: userId });
    if (!tenant) {
      throw Object.assign(new Error('Tenant not found for owner'), { statusCode: 403 });
    }
    return tenant._id as mongoose.Types.ObjectId;
  } else {
    const User = mongoose.models.User || mongoose.model('User');
    const user = await User.findById(userId);
    if (!user || !user.tenantId) {
      throw Object.assign(new Error('Tenant not found for user'), { statusCode: 403 });
    }
    return user.tenantId as mongoose.Types.ObjectId;
  }
};
