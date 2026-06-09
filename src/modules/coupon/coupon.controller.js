const { applyCoupon } = require('./coupon.service');
const { sendSuccess } = require('../../utils/apiResponse');

// POST /api/coupons/apply
const apply = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;
    const result = await applyCoupon(code, Number(orderAmount));
    sendSuccess(res, 200, 'Coupon applied', result);
  } catch (e) { next(e); }
};

module.exports = { apply };
