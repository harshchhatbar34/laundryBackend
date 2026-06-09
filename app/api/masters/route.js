import { connectDB } from '../../../lib/db';
import { sendSuccess, sendError } from '../../../lib/apiResponse';
import Material from '../../../src/modules/service/material.model';
import Item from '../../../src/modules/service/item.model';
import Service from '../../../src/modules/service/service.model';

export async function GET(req) {
  try {
    await connectDB();
    const materials = await Material.find({ isActive: true }).sort({ name: 1 });
    const items = await Item.find({ isActive: true }).sort({ name: 1 });
    const services = await Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    return sendSuccess(200, 'Masters fetched successfully', { materials, items, services });
  } catch (error) {
    return sendError(500, error.message);
  }
}
