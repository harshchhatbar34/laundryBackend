import { z } from 'zod';
import { withAuth } from '../../../../lib/auth';
import { connectDB } from '../../../../lib/db';
import { sendSuccess, sendError } from '../../../../lib/apiResponse';
const { getAddresses, addAddress } = require('../../../../src/modules/user/user.service');

const addressSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']).optional(),
  flatHouseNo: z.string().min(1, 'Flat/House No is required'),
  society: z.string().min(1, 'Society is required'),
  landmark: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit Pincode'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  isDefault: z.boolean().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

export const GET = withAuth(async (req, context) => {
  try {
    await connectDB();
    const addresses = await getAddresses(context.user._id);
    return sendSuccess(200, 'Addresses fetched', { addresses });
  } catch (e) {
    return sendError(500, e.message || 'Internal Server Error');
  }
});

export const POST = withAuth(async (req, context) => {
  try {
    await connectDB();
    const body = await req.json();

    const validatedData = addressSchema.safeParse(body);
    if (!validatedData.success) {
      return sendError(400, 'Validation failed', validatedData.error.errors);
    }

    const address = await addAddress(context.user._id, validatedData.data);
    return sendSuccess(201, 'Address added', { address });
  } catch (e) {
    return sendError(500, e.message || 'Internal Server Error');
  }
});
