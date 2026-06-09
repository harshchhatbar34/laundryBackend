import { NextResponse } from "next/server";

export function middleware(req) {
  // Log every incoming API request to Vercel
  if (req.method !== 'OPTIONS') {
    console.log(`[REQ] ${req.method} ${req.nextUrl.pathname}`);
  }

  // Dynamically reflect the incoming origin (acts as a wildcard but allows credentials)
  const origin = req.headers.get("origin") ?? "*";

  // Handle CORS preflight (OPTIONS) requests globally
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  // Inject CORS headers into actual responses
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}

export const config = {
  // Apply this middleware to all API routes
  matcher: "/api/:path*",
};
