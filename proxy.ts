import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/modules/identity/infrastructure/session-constants";
import { randomUUID } from "node:crypto";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/devices",
  "/alerts",
  "/events",
  "/topology",
  "/reports",
  "/settings",
] as const;

export function proxy(request: NextRequest) {
  const correlationId =
    request.headers
      .get("x-correlation-id")
      ?.match(/^[a-zA-Z0-9._-]{1,128}$/)?.[0] ?? randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-correlation-id", correlationId);
  const isProtected = PROTECTED_ROUTES.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`),
  );

  if (isProtected && !request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-correlation-id", correlationId);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/devices/:path*",
    "/alerts/:path*",
    "/events/:path*",
    "/topology/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};
