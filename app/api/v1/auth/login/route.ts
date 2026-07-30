import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { logEvent } from "@/lib/logger";
import { authenticateDemoUser } from "@/modules/identity/infrastructure/auth-service";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
} from "@/modules/identity/infrastructure/login-rate-limit";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "@/modules/identity/infrastructure/session";
import { loginRequestSchema } from "@/modules/identity/presentation/login-schema";

const MAX_BODY_BYTES = 4096;

function getClientKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  );
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  correlationId: string,
) {
  const response = NextResponse.json(
    { error: { code, message, correlationId } },
    { status },
  );
  response.headers.set("x-correlation-id", correlationId);
  return response;
}

export async function POST(request: NextRequest) {
  const correlationId =
    request.headers
      .get("x-correlation-id")
      ?.match(/^[a-zA-Z0-9._-]{1,128}$/)?.[0] ?? randomUUID();
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "The sign-in request is invalid.",
      correlationId,
    );
  }

  const clientKey = getClientKey(request);
  const rateLimit = checkLoginRateLimit(clientKey);

  if (!rateLimit.allowed) {
    const response = errorResponse(
      429,
      "RATE_LIMITED",
      "Too many sign-in attempts. Try again later.",
      correlationId,
    );
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    logEvent("warn", "auth.login.rate_limited", { correlationId, clientKey });
    return response;
  }

  let payload: unknown;
  try {
    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return errorResponse(
        400,
        "VALIDATION_ERROR",
        "The sign-in request is invalid.",
        correlationId,
      );
    }

    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "The sign-in request is invalid.",
      correlationId,
    );
  }

  const parsed = loginRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "The sign-in request is invalid.",
      correlationId,
    );
  }

  const result = await authenticateDemoUser(
    parsed.data.email,
    parsed.data.password,
  );

  if (!result.ok) {
    logEvent("warn", "auth.login.failed", {
      correlationId,
      email: parsed.data.email.toLowerCase(),
    });
    return errorResponse(
      401,
      result.code,
      "The email or password is incorrect.",
      correlationId,
    );
  }

  clearLoginRateLimit(clientKey);
  const token = await createSessionToken(result.user);
  const response = NextResponse.json({ data: { user: result.user } });
  response.headers.set("x-correlation-id", correlationId);
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());

  logEvent("info", "auth.login.succeeded", {
    correlationId,
    userId: result.user.id,
    role: result.user.role,
  });

  return response;
}
