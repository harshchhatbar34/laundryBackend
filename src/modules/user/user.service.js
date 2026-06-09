const User = require('./user.model');
const Address = require('./address.model');

/* ─── User profile ─────────────────────────────────── */

const getMyProfile = async (userId) => {
  return User.findById(userId);
};

const updateMyProfile = async (userId, updates) => {
  const allowed = ['name', 'email'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  );
  return User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
};

/* ─── Addresses ────────────────────────────────────── */

const getAddresses = async (userId) => {
  return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
};

const addAddress = async (userId, data) => {
  // If this is the first address or marked as default, unset others
  if (data.isDefault) {
    await Address.updateMany({ user: userId }, { isDefault: false });
  }
  const count = await Address.countDocuments({ user: userId });
  if (count === 0) data.isDefault = true; // First address is always default

  return Address.create({ user: userId, ...data });
};

const updateAddress = async (userId, addressId, data) => {
  if (data.isDefault) {
    await Address.updateMany({ user: userId }, { isDefault: false });
  }
  const address = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    data,
    { new: true, runValidators: true }
  );
  if (!address) throw Object.assign(new Error('Address not found'), { statusCode: 404 });
  return address;
};

const deleteAddress = async (userId, addressId) => {
  const address = await Address.findOneAndDelete({ _id: addressId, user: userId });
  if (!address) throw Object.assign(new Error('Address not found'), { statusCode: 404 });

  // If deleted address was default, make the next one default
  if (address.isDefault) {
    const next = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
  return address;
};

const setDefaultAddress = async (userId, addressId) => {
  await Address.updateMany({ user: userId }, { isDefault: false });
  const address = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    { isDefault: true },
    { new: true }
  );
  if (!address) throw Object.assign(new Error('Address not found'), { statusCode: 404 });
  return address;
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
