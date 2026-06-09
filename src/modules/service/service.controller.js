const { getAllServices } = require('./service.service');
const { sendSuccess } = require('../../utils/apiResponse');

// GET /api/services  — public
const listServices = async (req, res, next) => {
  try {
    const services = await getAllServices(true);
    sendSuccess(res, 200, 'Services fetched', { services });
  } catch (e) { next(e); }
};

module.exports = { listServices };
