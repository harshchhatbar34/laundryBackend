require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const { generalLimiter } = require('./middleware/rateLimiter');
const { errorMiddleware, notFoundMiddleware } = require('./middleware/error.middleware');

// Module routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const orderRoutes = require('./modules/order/order.routes');
const serviceRoutes = require('./modules/service/service.routes');
const couponRoutes = require('./modules/coupon/coupon.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const masterRoutes = require('./modules/service/master.routes');

const app = express();

/* ─── Security & Parsing ─────────────────────────── */
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ─── Rate limiting ──────────────────────────────── */
app.use('/api', generalLimiter);

/* ─── Health check ───────────────────────────────── */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ─── Routes ─────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/masters', masterRoutes);

/* ─── Error Handling ─────────────────────────────── */
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
