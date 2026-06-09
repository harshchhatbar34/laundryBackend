const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth.middleware');
const { apply } = require('./coupon.controller');

router.post('/apply', verifyToken, apply);

module.exports = router;
