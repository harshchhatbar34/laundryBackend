const jwt = require('jsonwebtoken');
const { sendError } = require('./apiResponse');

/**
 * Middleware wrapper for protected Next.js API Routes.
 * Extracts the JWT from the Authorization header and attaches the parsed user to the request context.
 * 
 * Usage:
 * export const GET = withAuth(async (req, { params, user }) => { ... })
 */
const withAuth = (handler) => {
  return async (req, context) => {
    try {
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendError(401, 'Unauthorized: No token provided');
      }

      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // We inject the user object into the context
        context.user = { _id: decoded.id };
      } catch (err) {
        return sendError(401, 'Unauthorized: Invalid or expired token');
      }

      return handler(req, context);
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      return sendError(500, 'Internal Server Error');
    }
  };
};

/**
 * Wrapper for routes that require an Admin role.
 * Requires the user model to fetch the role, but for simplicity we assume 
 * the role is either embedded in the JWT or we query it inside the handler.
 * If you put role in JWT, you can check it here. Otherwise, fetch user first.
 */
const withAdmin = (handler) => {
  return withAuth(async (req, context) => {
    const { connectDB } = require('./db');
    await connectDB();
    const User = require('../src/modules/user/user.model'); // adjust path if moved

    const user = await User.findById(context.user._id);
    if (!user || user.role !== 'admin') {
      return sendError(403, 'Forbidden: Admin access required');
    }
    
    // Inject full user object for convenience
    context.user = user;
    return handler(req, context);
  });
};

const withDriver = (handler) => {
  return withAuth(async (req, context) => {
    const { connectDB } = require('./db');
    await connectDB();
    const User = require('../src/modules/user/user.model'); // adjust path if moved

    const user = await User.findById(context.user._id);
    if (!user || user.role !== 'driver') {
      return sendError(403, 'Forbidden: Driver access required');
    }
    
    // Inject full user object for convenience
    context.user = user;
    return handler(req, context);
  });
};

module.exports = { withAuth, withAdmin, withDriver };
