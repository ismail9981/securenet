import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/modules/identity/infrastructure/session-constants";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/devices",
  "/alerts",
  "/events",
  "/topology",
] as const;

export function proxy(request: NextRequest) {
  const isProtected = PROTECTED_ROUTES.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`),
  );

  if (isProtected && !request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/devices/:path*",
    "/alerts/:path*",
    "/events/:path*",
    "/topology/:path*",
  ],
};
