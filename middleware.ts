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
function applyCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Tenant-Code');
  return response;
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
    return applyCorsHeaders(new NextResponse(null, { status: 200 }));
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
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
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
    return applyCorsHeaders(NextResponse.next());
  }

  // ── For /api/superadmin/* also accept admin_token cookie (used by admin UI) ──
  if (pathname.startsWith('/api/superadmin/') || pathname.startsWith('/api/admin-auth/')) {
    const adminToken = req.cookies.get('admin_token')?.value;
    if (adminToken) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(adminToken, secret);
        if (payload['role'] === 'superadmin') {
          const requestHeaders = new Headers(req.headers);
          requestHeaders.set('x-user-id', payload['id'] as string);
          requestHeaders.set('x-user-role', payload['role'] as string);
          const response = NextResponse.next({ request: { headers: requestHeaders } });
          return applyCorsHeaders(response);
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
      )
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload['id'] as string);
    requestHeaders.set('x-user-role', payload['role'] as string);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return applyCorsHeaders(response);

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
      )
    );
  }
}

// Apply middleware to API + Admin routes
export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
};
