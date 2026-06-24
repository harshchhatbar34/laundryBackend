import { Types } from 'mongoose';
import Service from './service.model';
import Material from './material.model';
import Item from './item.model';

// ─── Services ────────────────────────────────────────────────────────────────

export const getOwnerServices = (tenantId: string | Types.ObjectId, activeOnly = true) => {
  const query: any = { tenant: tenantId };
  if (activeOnly) query.isActive = true;
  return Service.find(query).sort({ sortOrder: 1, name: 1 });
};

export const createService = (tenantId: string | Types.ObjectId, data: { name: string; description?: string; icon?: string; price?: number; sortOrder?: number }) =>
  Service.create({ ...data, tenant: tenantId });

export const updateService = async (id: string, tenantId: string | Types.ObjectId, data: Partial<{ name: string; description: string; icon: string; price: number; sortOrder: number; isActive: boolean }>) => {
  const svc = await Service.findOneAndUpdate({ _id: id, tenant: tenantId }, { $set: data }, { new: true, runValidators: true });
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return svc;
};

export const deleteService = async (id: string, tenantId: string | Types.ObjectId) => {
  const svc = await Service.findOneAndDelete({ _id: id, tenant: tenantId });
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
};

// ─── Materials ────────────────────────────────────────────────────────────────

export const getOwnerMaterials = (tenantId: string | Types.ObjectId, activeOnly = true) => {
  const query: any = { tenant: tenantId };
  if (activeOnly) query.isActive = true;
  return Material.find(query).sort({ name: 1 });
};

export const createMaterial = (tenantId: string | Types.ObjectId, data: { name: string; price?: number }) =>
  Material.create({ ...data, tenant: tenantId });

export const updateMaterial = async (id: string, tenantId: string | Types.ObjectId, data: Partial<{ name: string; price: number; isActive: boolean }>) => {
  const m = await Material.findOneAndUpdate({ _id: id, tenant: tenantId }, { $set: data }, { new: true, runValidators: true });
  if (!m) throw Object.assign(new Error('Material not found'), { statusCode: 404 });
  return m;
};

export const deleteMaterial = async (id: string, tenantId: string | Types.ObjectId) => {
  const m = await Material.findOneAndDelete({ _id: id, tenant: tenantId });
  if (!m) throw Object.assign(new Error('Material not found'), { statusCode: 404 });
};

// ─── Items ────────────────────────────────────────────────────────────────────

export const getOwnerItems = (tenantId: string | Types.ObjectId, activeOnly = true) => {
  const query: any = { tenant: tenantId };
  if (activeOnly) query.isActive = true;
  return Item.find(query).sort({ name: 1 });
};

export const createItem = (tenantId: string | Types.ObjectId, data: { name: string; price?: number }) =>
  Item.create({ ...data, tenant: tenantId });

export const updateItem = async (id: string, tenantId: string | Types.ObjectId, data: Partial<{ name: string; price: number; isActive: boolean }>) => {
  const it = await Item.findOneAndUpdate({ _id: id, tenant: tenantId }, { $set: data }, { new: true, runValidators: true });
  if (!it) throw Object.assign(new Error('Item not found'), { statusCode: 404 });
  return it;
};

export const deleteItem = async (id: string, tenantId: string | Types.ObjectId) => {
  const it = await Item.findOneAndDelete({ _id: id, tenant: tenantId });
  if (!it) throw Object.assign(new Error('Item not found'), { statusCode: 404 });
};
