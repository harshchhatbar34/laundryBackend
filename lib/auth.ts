import { NextRequest, NextResponse } from 'next/server';
import { sendError } from './apiResponse';
import type { UserRole, AuthContext } from '@/types';
import mongoose from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler<Ctx extends AuthContext = AuthContext> = (req: NextRequest, ctx: Ctx) => Promise<NextResponse<any>>;

/**
 * Reads the user identity injected by middleware (x-user-id, x-user-role headers).
 * The middleware has already verified the JWT at the edge — no double verification needed.
 * Returns null if headers are missing (should not happen on protected routes).
 */
function getUserFromHeaders(req: NextRequest): { _id: mongoose.Types.ObjectId; role: UserRole } | null {
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role') as UserRole | null;

  if (!userId || !userRole) return null;

  return {
    _id: new mongoose.Types.ObjectId(userId),
    role: userRole,
  };
}

/**
 * withAuth — wraps a route handler, injecting ctx.user from middleware headers.
 * Middleware already verifies JWT; this just extracts user info and injects it.
 */
export function withAuth<Ctx extends AuthContext = AuthContext>(handler: RouteHandler<Ctx>) {
  return async (req: NextRequest, ctx: Omit<Ctx, 'user'>) => {
    const user = getUserFromHeaders(req);

    if (!user) {
      // Fallback — should be caught by middleware, but just in case
      return sendError(401, 'Unauthorized: No valid session');
    }

    const authedCtx = { ...ctx, user } as Ctx;

    try {
      return await handler(req, authedCtx);
    } catch (err: unknown) {
      const error = err as { message?: string; statusCode?: number };
      console.error('[Handler Error]', error);
      return sendError(error.statusCode ?? 500, error.message ?? 'Internal Server Error');
    }
  };
}

/**
 * withRole — extends withAuth with role-based access control.
 * Usage: withRole('owner', 'superadmin')(handler)
 */
export function withRole(...roles: UserRole[]) {
  return <Ctx extends AuthContext = AuthContext>(handler: RouteHandler<Ctx>) =>
    withAuth<Ctx>(async (req, ctx) => {
      if (!roles.includes(ctx.user.role)) {
        return sendError(403, `Forbidden: This action requires [${roles.join(' or ')}] role. Your role: ${ctx.user.role}`);
      }
      return handler(req, ctx);
    });
}
