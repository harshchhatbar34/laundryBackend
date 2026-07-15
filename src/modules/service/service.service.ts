import mongoose, { Types } from 'mongoose';
import Service from './service.model';
import Material from './material.model';
import Item from './item.model';

// ─── Services ────────────────────────────────────────────────────────────────

export const getOwnerServices = (tenantId: string | Types.ObjectId, activeOnly = true, branchId?: string) => {
  const query: any = { tenant: tenantId };
  if (activeOnly) query.isActive = true;
  if (branchId) query.branches = branchId;
  return Service.find(query).sort({ sortOrder: 1, name: 1 });
};

export const createService = async (
  tenantId: string | Types.ObjectId, 
  data: { 
    name: string; 
    description?: string; 
    icon?: string; 
    price?: number; 
    sortOrder?: number;
    isAllBranches?: boolean;
    branches?: string[];
  }
) => {
  let branchIds = data.branches || [];
  const isAll = data.isAllBranches !== false;
  if (isAll) {
    const Branch = mongoose.model('Branch');
    const list = await Branch.find({ tenant: tenantId }, '_id');
    branchIds = list.map((b: any) => b._id.toString());
  }
  return Service.create({
    ...data,
    tenant: tenantId,
    isAllBranches: isAll,
    branches: branchIds,
  });
};

export const updateService = async (
  id: string, 
  tenantId: string | Types.ObjectId, 
  data: Partial<{ 
    name: string; 
    description: string; 
    icon: string; 
    price: number; 
    sortOrder: number; 
    isActive: boolean;
    isAllBranches: boolean;
    branches: string[];
  }>
) => {
  const updates: any = { ...data };
  if (data.isAllBranches === true) {
    const Branch = mongoose.model('Branch');
    const list = await Branch.find({ tenant: tenantId }, '_id');
    updates.branches = list.map((b: any) => b._id.toString());
  }
  const svc = await Service.findOneAndUpdate({ _id: id, tenant: tenantId }, { $set: updates }, { new: true, runValidators: true });
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return svc;
};

export const deleteService = async (id: string, tenantId: string | Types.ObjectId) => {
  const svc = await Service.findOneAndDelete({ _id: id, tenant: tenantId });
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
};

// ─── Materials ────────────────────────────────────────────────────────────────

export const getOwnerMaterials = (tenantId: string | Types.ObjectId, activeOnly = true, branchId?: string) => {
  const query: any = { tenant: tenantId };
  if (activeOnly) query.isActive = true;
  if (branchId) query.branches = branchId;
  return Material.find(query).sort({ name: 1 });
};

export const createMaterial = async (
  tenantId: string | Types.ObjectId, 
  data: { 
    name: string; 
    price?: number;
    isAllBranches?: boolean;
    branches?: string[];
  }
) => {
  let branchIds = data.branches || [];
  const isAll = data.isAllBranches !== false;
  if (isAll) {
    const Branch = mongoose.model('Branch');
    const list = await Branch.find({ tenant: tenantId }, '_id');
    branchIds = list.map((b: any) => b._id.toString());
  }
  return Material.create({
    ...data,
    tenant: tenantId,
    isAllBranches: isAll,
    branches: branchIds,
  });
};

export const updateMaterial = async (
  id: string, 
  tenantId: string | Types.ObjectId, 
  data: Partial<{ 
    name: string; 
    price: number; 
    isActive: boolean;
    isAllBranches: boolean;
    branches: string[];
  }>
) => {
  const updates: any = { ...data };
  if (data.isAllBranches === true) {
    const Branch = mongoose.model('Branch');
    const list = await Branch.find({ tenant: tenantId }, '_id');
    updates.branches = list.map((b: any) => b._id.toString());
  }
  const m = await Material.findOneAndUpdate({ _id: id, tenant: tenantId }, { $set: updates }, { new: true, runValidators: true });
  if (!m) throw Object.assign(new Error('Material not found'), { statusCode: 404 });
  return m;
};

export const deleteMaterial = async (id: string, tenantId: string | Types.ObjectId) => {
  const m = await Material.findOneAndDelete({ _id: id, tenant: tenantId });
  if (!m) throw Object.assign(new Error('Material not found'), { statusCode: 404 });
};

// ─── Items ────────────────────────────────────────────────────────────────────

export const getOwnerItems = (tenantId: string | Types.ObjectId, activeOnly = true, branchId?: string) => {
  const query: any = { tenant: tenantId };
  if (activeOnly) query.isActive = true;
  if (branchId) query.branches = branchId;
  return Item.find(query).sort({ name: 1 });
};

export const createItem = async (
  tenantId: string | Types.ObjectId, 
  data: { 
    name: string; 
    price?: number;
    isAllBranches?: boolean;
    branches?: string[];
  }
) => {
  let branchIds = data.branches || [];
  const isAll = data.isAllBranches !== false;
  if (isAll) {
    const Branch = mongoose.model('Branch');
    const list = await Branch.find({ tenant: tenantId }, '_id');
    branchIds = list.map((b: any) => b._id.toString());
  }
  return Item.create({
    ...data,
    tenant: tenantId,
    isAllBranches: isAll,
    branches: branchIds,
  });
};

export const updateItem = async (
  id: string, 
  tenantId: string | Types.ObjectId, 
  data: Partial<{ 
    name: string; 
    price: number; 
    isActive: boolean;
    isAllBranches: boolean;
    branches: string[];
  }>
) => {
  const updates: any = { ...data };
  if (data.isAllBranches === true) {
    const Branch = mongoose.model('Branch');
    const list = await Branch.find({ tenant: tenantId }, '_id');
    updates.branches = list.map((b: any) => b._id.toString());
  }
  const it = await Item.findOneAndUpdate({ _id: id, tenant: tenantId }, { $set: updates }, { new: true, runValidators: true });
  if (!it) throw Object.assign(new Error('Item not found'), { statusCode: 404 });
  return it;
};

export const deleteItem = async (id: string, tenantId: string | Types.ObjectId) => {
  const it = await Item.findOneAndDelete({ _id: id, tenant: tenantId });
  if (!it) throw Object.assign(new Error('Item not found'), { statusCode: 404 });
};
