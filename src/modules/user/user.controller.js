const {
  getMyProfile,
  updateMyProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('./user.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/* ─── Profile ───────────────────────────────────────── */

const getMe = async (req, res, next) => {
  try {
    const user = await getMyProfile(req.user._id);
    sendSuccess(res, 200, 'Profile fetched', { user });
  } catch (e) { next(e); }
};

const updateMe = async (req, res, next) => {
  try {
    const user = await updateMyProfile(req.user._id, req.body);
    sendSuccess(res, 200, 'Profile updated', { user });
  } catch (e) { next(e); }
};

/* ─── Addresses ─────────────────────────────────────── */

const listAddresses = async (req, res, next) => {
  try {
    const addresses = await getAddresses(req.user._id);
    sendSuccess(res, 200, 'Addresses fetched', { addresses });
  } catch (e) { next(e); }
};

const createAddress = async (req, res, next) => {
  try {
    const address = await addAddress(req.user._id, req.body);
    sendSuccess(res, 201, 'Address added', { address });
  } catch (e) { next(e); }
};

const editAddress = async (req, res, next) => {
  try {
    const address = await updateAddress(req.user._id, req.params.id, req.body);
    sendSuccess(res, 200, 'Address updated', { address });
  } catch (e) { next(e); }
};

const removeAddress = async (req, res, next) => {
  try {
    await deleteAddress(req.user._id, req.params.id);
    sendSuccess(res, 200, 'Address deleted');
  } catch (e) { next(e); }
};

const makeDefault = async (req, res, next) => {
  try {
    const address = await setDefaultAddress(req.user._id, req.params.id);
    sendSuccess(res, 200, 'Default address updated', { address });
  } catch (e) { next(e); }
};

module.exports = { getMe, updateMe, listAddresses, createAddress, editAddress, removeAddress, makeDefault };
