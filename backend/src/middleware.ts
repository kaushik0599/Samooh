import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * The frontend now calls this backend cross-origin (separate Next.js app,
 * separate port/domain — see docs/BACKEND_ARCHITECTURE.md). None of the
 * 13 route handlers were changed to add this; it's applied uniformly here
 * so no individual route needs to know about CORS.
 */
const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders() });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
