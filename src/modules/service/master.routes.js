const express = require('express');
const router = express.Router();
const masterController = require('./master.controller');

router.get('/materials', masterController.getMaterials);
router.get('/items', masterController.getItems);
router.get('/services', masterController.getServices);
router.get('/price', masterController.getPrice);

module.exports = router;
