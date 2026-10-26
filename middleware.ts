import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Public API routes (no token required) ────────────────────────────────────
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/set-password',
  '/api/admin-auth/login',
  '/api/debug-log',
];

// ─── Admin public pages (no cookie required) ─────────────────────────────────
const ADMIN_PUBLIC_PAGES = ['/admin/login'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isAdminPublicPage(pathname: string): boolean {
  return ADMIN_PUBLIC_PAGES.some((p) => pathname.startsWith(p));
}

// ─── Helper: CORS headers ─────────────────────────────────────────────────────
// ─── Helper: CORS headers ─────────────────────────────────────────────────────
function applyCorsHeaders(response: NextResponse, req?: NextRequest): NextResponse {
  const requestOrigin = req?.headers.get('origin');
  // Reflect origin when present to satisfy Access-Control-Allow-Credentials, fallback to '*'
  const allowedOrigin = requestOrigin || '*';
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Tenant-Code');
  return response;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
  if (!secret) {
    console.error('[CRITICAL SECURITY RISK] JWT_SECRET environment variable is not configured');
    throw new Error('Server configuration error: JWT_SECRET missing');
  }
  return new TextEncoder().encode(secret);
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Log every incoming API request ─────────────────────────────────────────
  if (req.method !== 'OPTIONS') {
    console.log(`[REQ] ${req.method} ${pathname}`);
  }

  // ── Handle CORS preflight (OPTIONS) — only for /api/* ──────────────────────
  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return applyCorsHeaders(new NextResponse(null, { status: 200 }), req);
  }

  // ════════════════════════════════════════════════════════════
  // ADMIN PAGE PROTECTION  (/admin/*)
  // ════════════════════════════════════════════════════════════
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Let login page through
    if (isAdminPublicPage(pathname)) {
      return NextResponse.next();
    }

    const adminToken = req.cookies.get('admin_token')?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    try {
      const secret = getJwtSecret();
      const { payload } = await jwtVerify(adminToken, secret);

      if (payload['role'] !== 'superadmin') {
        const res = NextResponse.redirect(new URL('/admin/login', req.url));
        res.cookies.delete('admin_token');
        return res;
      }

      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.delete('admin_token');
      return res;
    }
  }

  // ════════════════════════════════════════════════════════════
  // API PROTECTION  (/api/*)
  // ════════════════════════════════════════════════════════════

  // Skip auth check for public routes
  if (isPublicRoute(pathname)) {
    return applyCorsHeaders(NextResponse.next(), req);
  }

  // ── For /api/superadmin/* also accept admin_token cookie (used by admin UI) ──
  if (pathname.startsWith('/api/superadmin/') || pathname.startsWith('/api/admin-auth/')) {
    const adminToken = req.cookies.get('admin_token')?.value;
    if (adminToken) {
      try {
        const secret = getJwtSecret();
        const { payload } = await jwtVerify(adminToken, secret);
        if (payload['role'] === 'superadmin') {
          const requestHeaders = new Headers(req.headers);
          requestHeaders.set('x-user-id', payload['id'] as string);
          requestHeaders.set('x-user-role', payload['role'] as string);
          const response = NextResponse.next({ request: { headers: requestHeaders } });
          return applyCorsHeaders(response, req);
        }
      } catch {
        // fall through to Bearer token check below
      }
    }
  }

  // Verify JWT Bearer token
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, message: 'Unauthorized: No token provided', errors: [] },
        { status: 401 }
      ),
      req
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload['id'] as string);
    requestHeaders.set('x-user-role', payload['role'] as string);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return applyCorsHeaders(response, req);

  } catch (err: unknown) {
    const isExpired = err instanceof Error && err.message.includes('exp');
    return applyCorsHeaders(
      NextResponse.json(
        {
          success: false,
          message: isExpired
            ? 'Session expired. Please log in again.'
            : 'Unauthorized: Invalid token',
          errors: [],
        },
        { status: 401 }
      ),
      req
    );
  }
}

// Apply middleware to API + Admin routes
export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
