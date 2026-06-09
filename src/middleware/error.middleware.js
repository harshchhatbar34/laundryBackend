const logger = require('../utils/logger');
const { sendError } = require('../utils/apiResponse');

/**
 * Global error handling middleware
 * Must be registered LAST in Express app (after all routes)
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, 400, 'Validation failed', errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, 409, `${field} already exists.`);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, 400, `Invalid ${err.path}: ${err.value}`);
  }

  // JWT errors (shouldn't normally reach here if auth middleware handles them)
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token.');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired.');
  }

  // Default 500
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  return sendError(res, statusCode, message);
};

/**
 * 404 handler — must be registered before errorMiddleware
 */
const notFoundMiddleware = (req, res) => {
  sendError(res, 404, `Route ${req.originalUrl} not found`);
};

module.exports = { errorMiddleware, notFoundMiddleware };
