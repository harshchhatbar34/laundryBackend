import Service from './service.model';
import Material from './material.model';
import Item from './item.model';
import Price from './price.model';

// ─── Services ────────────────────────────────────────────────────────────────

export const getAllServices = (activeOnly = true) =>
  Service.find(activeOnly ? { isActive: true } : {}).sort({ sortOrder: 1, name: 1 });

export const createService = (data: { name: string; description?: string; icon?: string; sortOrder?: number }) =>
  Service.create(data);

export const updateService = async (id: string, data: Partial<{ name: string; description: string; icon: string; sortOrder: number; isActive: boolean }>) => {
  const svc = await Service.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return svc;
};

export const deleteService = async (id: string) => {
  const svc = await Service.findByIdAndDelete(id);
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
};

// ─── Materials ────────────────────────────────────────────────────────────────

export const getAllMaterials = () => Material.find({ isActive: true }).sort({ name: 1 });

export const createMaterial = (data: { name: string }) => Material.create(data);

export const deleteMaterial = async (id: string) => {
  const m = await Material.findByIdAndDelete(id);
  if (!m) throw Object.assign(new Error('Material not found'), { statusCode: 404 });
};

// ─── Items ────────────────────────────────────────────────────────────────────

export const getAllItems = () => Item.find({ isActive: true }).sort({ name: 1 });

export const createItem = (data: { name: string }) => Item.create(data);

export const deleteItem = async (id: string) => {
  const it = await Item.findByIdAndDelete(id);
  if (!it) throw Object.assign(new Error('Item not found'), { statusCode: 404 });
};

// ─── Prices ───────────────────────────────────────────────────────────────────

export const getAllPrices = () =>
  Price.find()
    .populate('service', 'name icon')
    .populate('material', 'name')
    .populate('item', 'name')
    .sort({ createdAt: -1 });

export const upsertPrice = async (data: { service: string; material: string; item: string; price: number }) => {
  return Price.findOneAndUpdate(
    { service: data.service, material: data.material, item: data.item },
    { $set: { price: data.price } },
    { new: true, upsert: true, runValidators: true }
  );
};

export const deletePrice = async (id: string) => {
  const p = await Price.findByIdAndDelete(id);
  if (!p) throw Object.assign(new Error('Price not found'), { statusCode: 404 });
};
