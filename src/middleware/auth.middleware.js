const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');
const User = require('../modules/user/user.model');

/**
 * Verify JWT token — attaches req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-__v');
    if (!user) {
      return sendError(res, 401, 'User not found. Token invalid.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expired. Please login again.');
    }
    return sendError(res, 401, 'Invalid token.');
  }
};

/**
 * Verify admin role — must be used after verifyToken
 */
const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return sendError(res, 403, 'Access denied. Admin privileges required.');
  }
  next();
};

const verifyDriver = (req, res, next) => {
  if (!['driver', 'admin'].includes(req.user?.role)) {
    return sendError(res, 403, 'Access denied. Driver privileges required.');
  }
  next();
};

module.exports = { verifyToken, verifyAdmin, verifyDriver };
