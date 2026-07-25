import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/modules/identity/infrastructure/session";

export async function GET(request: NextRequest) {
  const correlationId = randomUUID();
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (!session) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Authentication is required.",
          correlationId,
        },
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    data: {
      user: session.user,
      expiresAt: session.expiresAt,
    },
  });
}
