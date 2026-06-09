const Service = require('./service.model');

const getAllServices = async (activeOnly = true) => {
  const query = activeOnly ? { isActive: true } : {};
  return Service.find(query).sort({ sortOrder: 1, name: 1 });
};

const getServiceById = async (id) => {
  const service = await Service.findById(id);
  if (!service) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return service;
};

const createService = async (data) => {
  return Service.create(data);
};

const updateService = async (id, data) => {
  const service = await Service.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!service) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return service;
};

const deleteService = async (id) => {
  const service = await Service.findByIdAndDelete(id);
  if (!service) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return service;
};

module.exports = { getAllServices, getServiceById, createService, updateService, deleteService };
