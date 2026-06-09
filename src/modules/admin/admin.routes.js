const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../../middleware/auth.middleware');
const c = require('./admin.controller');

// All admin routes require token + admin role
router.use(verifyToken, verifyAdmin);

// Stats
router.get('/stats', c.stats);

// Orders
router.get('/orders', c.listOrders);
router.put('/orders/:id/status', c.updateStatus);

// Users
router.get('/users', c.listUsers);
router.get('/users/:id', c.userDetail);

// Services
router.get('/services', c.listServices);
router.post('/services', c.createService);
router.put('/services/:id', c.updateService);
router.delete('/services/:id', c.deleteService);

// Coupons
router.get('/coupons', c.listCoupons);
router.post('/coupons', c.createCoupon);
router.put('/coupons/:id', c.updateCoupon);
router.delete('/coupons/:id', c.deleteCoupon);

// Drivers
router.get('/drivers', c.listDrivers);
router.post('/drivers', c.createDriver);
router.put('/drivers/:id', c.updateDriver);
router.delete('/drivers/:id', c.deleteDriver);
router.post('/orders/:orderId/assign-driver', c.assignDriver);

module.exports = router;
