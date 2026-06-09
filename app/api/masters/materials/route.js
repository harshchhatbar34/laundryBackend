import { connectDB } from '../../../../../lib/db';
import { sendSuccess, sendError } from '../../../../../lib/apiResponse';
import Material from '../../../../../src/modules/service/material.model';

export async function GET(req) {
  try {
    await connectDB();
    const materials = await Material.find({ isActive: true }).sort({ name: 1 });
    return sendSuccess(200, 'Materials fetched successfully', { materials });
  } catch (error) {
    return sendError(500, error.message);
  }
}
