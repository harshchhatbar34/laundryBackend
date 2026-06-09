import { z } from 'zod';
import { withAuth } from '../../../../../lib/auth';
import { connectDB } from '../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../lib/apiResponse';
const { editAddress, removeAddress } = require('../../../../../src/modules/user/user.service');

const addressSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']).optional(),
  flatHouseNo: z.string().min(1, 'Flat/House No is required').optional(),
  society: z.string().min(1, 'Society is required').optional(),
  landmark: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit Pincode').optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State is required').optional(),
  isDefault: z.boolean().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export const PUT = withAuth(async (req, context) => {
  try {
    await connectDB();
    const { id } = context.params;
    const body = await req.json();

    const validatedData = addressSchema.safeParse(body);
    if (!validatedData.success) {
      return sendError(400, 'Validation failed', validatedData.error.errors);
    }

    const address = await editAddress(context.user._id, id, validatedData.data);
    return sendSuccess(200, 'Address updated', { address });
  } catch (e) {
    const status = e.statusCode || 500;
    return sendError(status, e.message || 'Internal Server Error');
  }
});

export const DELETE = withAuth(async (req, context) => {
  try {
    await connectDB();
    const { id } = context.params;
    await removeAddress(context.user._id, id);
    return sendSuccess(200, 'Address removed successfully');
  } catch (e) {
    const status = e.statusCode || 500;
    return sendError(status, e.message || 'Internal Server Error');
  }
});
