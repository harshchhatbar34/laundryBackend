const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth.middleware');
const {
  getMe, updateMe,
  listAddresses, createAddress, editAddress, removeAddress, makeDefault,
} = require('./user.controller');

// All routes protected
router.use(verifyToken);

// Profile
router.get('/me', getMe);
router.put('/me', updateMe);

// Addresses
router.get('/addresses', listAddresses);
router.post('/addresses', createAddress);
router.put('/addresses/:id', editAddress);
router.delete('/addresses/:id', removeAddress);
router.patch('/addresses/:id/default', makeDefault);

module.exports = router;
