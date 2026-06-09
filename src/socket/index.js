const logger = require('../utils/logger');

// Map of userId → socketId for targeted emissions
const userSocketMap = new Map();

const initSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Client sends their userId after connecting
    socket.on('register', (userId) => {
      if (userId) {
        userSocketMap.set(String(userId), socket.id);
        logger.info(`User ${userId} registered to socket ${socket.id}`);
      }
    });

    // Join an order-specific room for real-time tracking
    socket.on('join_order', (orderId) => {
      socket.join(`order:${orderId}`);
      logger.debug(`Socket ${socket.id} joined room order:${orderId}`);
    });

    socket.on('leave_order', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      // Remove from map
      for (const [userId, sid] of userSocketMap.entries()) {
        if (sid === socket.id) {
          userSocketMap.delete(userId);
          logger.info(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return { userSocketMap };
};

/**
 * Emit order status update to the order room
 * Call this from admin.service when status changes
 */
const emitOrderUpdate = (io, orderId, data) => {
  io.to(`order:${orderId}`).emit('order_updated', data);
};

/**
 * Emit notification to a specific user
 */
const emitNotification = (io, userId, notification) => {
  const socketId = userSocketMap.get(String(userId));
  if (socketId) {
    io.to(socketId).emit('notification', notification);
  }
};

module.exports = { initSocket, emitOrderUpdate, emitNotification };
