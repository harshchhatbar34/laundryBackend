const express = require('express');
const router = express.Router();
const { listServices } = require('./service.controller');

// GET /api/services — public route
router.get('/', listServices);

module.exports = router;
