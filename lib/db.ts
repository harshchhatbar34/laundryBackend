import mongoose from 'mongoose';

// Register all models to prevent Mongoose schema registration exceptions in Next.js routes
import '@/src/modules/user/user.model';
import '@/src/modules/tenant/tenant.model';
import '@/src/modules/branch/branch.model';
import '@/src/modules/coupon/coupon.model';
import '@/src/modules/notification/notification.model';
import '@/src/modules/order/order.model';
import '@/src/modules/rating/rating.model';
import '@/src/modules/user/address.model';
import '@/src/modules/service/material.model';
import '@/src/modules/service/item.model';
import '@/src/modules/service/service.model';

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env');
}

/**
 * Global cache to prevent multiple connections during hot reloads in dev.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
