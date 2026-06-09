/**
 * Standardised API response helpers
 * Usage:
 *   sendSuccess(res, 200, 'User fetched', { user })
 *   sendError(res, 404, 'User not found')
 */

const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, statusCode = 500, message = 'Something went wrong', errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Paginated list response wrapper
 */
const sendPaginated = (res, message, data, pagination) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination, // { total, page, limit, totalPages }
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
