const express = require('express');
const router = express.Router();
const { verifyToken, verifyDriver } = require('../../middleware/auth.middleware');
const { placeOrder, myOrders, orderDetail, cancel, downloadInvoice, driverOrders, driverUpdateStatus, driverUpdateLocation } = require('./order.controller');

router.use(verifyToken);

// Customer routes
router.post('/', placeOrder);
router.get('/', myOrders);
router.get('/:id', orderDetail);
router.get('/:id/invoice', downloadInvoice);
router.put('/:id/cancel', cancel);

// Driver routes
router.get('/driver/assigned', verifyDriver, driverOrders);
router.put('/driver/:id/status', verifyDriver, driverUpdateStatus);
router.put('/driver/location', verifyDriver, driverUpdateLocation);

module.exports = router;
