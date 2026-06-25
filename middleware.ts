import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Public routes (no token required) ───────────────────────────────────────
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
];

// ─── Helper: is this route public? ───────────────────────────────────────────
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

// ─── Helper: CORS headers ─────────────────────────────────────────────────────
// Allow any origin so mobile apps (Flutter, React Native, Expo) and web frontends
// can all connect without CORS issues.
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

  // ── Handle CORS preflight (OPTIONS) ────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 200 }));
  }

  // ── Skip auth check for public routes ──────────────────────────────────────
  if (isPublicRoute(pathname)) {
    return applyCorsHeaders(NextResponse.next());
  }

  // ── Verify JWT for all other /api/* routes ──────────────────────────────────
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return applyCorsHeaders(
      NextResponse.json(
        { success: false, message: 'Unauthorized: No token provided', errors: [] },
        { status: 401 }
      ),
      origin
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // ── Inject decoded user info into request headers ─────────────────────────
    // Route handlers can read these via req.headers.get('x-user-id') etc.
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

// Apply middleware to all API routes
export const config = {
  matcher: '/api/:path*',
};
