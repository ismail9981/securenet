import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { logEvent } from "@/lib/logger";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/modules/identity/infrastructure/session";

export async function POST(request: NextRequest) {
  const correlationId = randomUUID();
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  const response = NextResponse.json({ data: { signedOut: true } });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  logEvent("info", "auth.logout", {
    correlationId,
    userId: session?.user.id ?? null,
  });

  return response;
}
