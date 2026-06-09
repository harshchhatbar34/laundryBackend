const Material = require('./material.model');
const Item = require('./item.model');
const Service = require('./service.model');
const Price = require('./price.model');
const { sendSuccess } = require('../../utils/apiResponse');

const getMaterials = async (req, res, next) => {
  try {
    const materials = await Material.find({ isActive: true }).sort({ name: 1 });
    return sendSuccess(res, 200, 'Materials fetched successfully', { materials });
  } catch (error) {
    next(error);
  }
};

const getItems = async (req, res, next) => {
  try {
    const items = await Item.find({ isActive: true }).sort({ name: 1 });
    return sendSuccess(res, 200, 'Items fetched successfully', { items });
  } catch (error) {
    next(error);
  }
};

const getServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    return sendSuccess(res, 200, 'Services fetched successfully', { services });
  } catch (error) {
    next(error);
  }
};

const getPrice = async (req, res, next) => {
  try {
    const { materialId, itemId, serviceId } = req.query;
    const priceDoc = await Price.findOne({
      material: materialId,
      item: itemId,
      service: serviceId,
    });

    if (!priceDoc) {
      return sendSuccess(res, 200, 'Price not found', { price: 0 });
    }

    return sendSuccess(res, 200, 'Price fetched successfully', { price: priceDoc.price });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaterials,
  getItems,
  getServices,
  getPrice,
};
