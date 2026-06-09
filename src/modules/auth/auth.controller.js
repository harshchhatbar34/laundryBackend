const { validationResult } = require('express-validator');
const { registerService, loginService } = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, 'Validation failed', errors.array());
    }

    const result = await registerService(req.body);
    return sendSuccess(res, 201, 'Registration successful', result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, 'Validation failed', errors.array());
    }

    const { email, password } = req.body;
    const result = await loginService(email, password);
    return sendSuccess(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };
