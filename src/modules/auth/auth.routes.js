const express = require('express');
const router = express.Router();

const { register, login } = require('./auth.controller');
const { registerValidation, loginValidation } = require('./auth.validation');

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

module.exports = router;
