import { NextRequest, NextResponse } from "next/server";

function allowedOrigins() {
  return (process.env.RES_ALLOWED_ORIGINS ?? process.env.FRONTEND_URL ?? "").split(",").map((value) => value.trim()).filter(Boolean);
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = allowedOrigins();
  const isAllowedOrigin = Boolean(origin && allowed.includes(origin));

  if (request.method === "OPTIONS" && request.nextUrl.pathname.startsWith("/api/")) {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin!);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, X-Request-Id");
    }
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }
  return response;
}

export const config = { matcher: ["/api/:path*"] };
