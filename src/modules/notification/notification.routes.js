const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth.middleware');
const { list, readOne, readAll } = require('./notification.controller');

router.use(verifyToken);

router.get('/', list);
router.put('/read-all', readAll);
router.put('/:id/read', readOne);

module.exports = router;
