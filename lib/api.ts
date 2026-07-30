import { randomUUID } from "node:crypto";
import { isIP } from "node:net";

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { logEvent } from "@/lib/logger";
import { AuthorizationError } from "@/modules/identity/domain/permissions";
import type { Permission } from "@/modules/identity/domain/permissions";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type Session,
} from "@/modules/identity/infrastructure/session";
import {
  DeviceConflictError,
  DeviceNotFoundError,
  DeviceReferenceError,
} from "@/modules/inventory/application/device-errors";
import {
  AlertActiveConflictError,
  AlertNotFoundError,
} from "@/modules/alerting/application/alert-errors";
import { AlertLifecycleError } from "@/modules/alerting/domain/alert";
import { SimulationError } from "@/modules/simulation/application/simulation-errors";
import {
  checkMutationRateLimit,
  MutationRateLimitError,
} from "@/modules/identity/infrastructure/mutation-rate-limit";

const MAX_JSON_BODY_BYTES = 16_384;

export function apiSuccess(
  data: unknown,
  options?: { readonly meta?: unknown; readonly status?: number },
): NextResponse {
  return NextResponse.json(
    {
      data,
      ...(options?.meta === undefined ? {} : { meta: options.meta }),
    },
    { status: options?.status ?? 200 },
  );
}

export function apiError(
  status: number,
  code: string,
  message: string,
  correlationId = randomUUID(),
  fieldErrors?: Readonly<Record<string, readonly string[]>>,
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
        correlationId,
      },
    },
    { status },
  );
}

export async function getApiSession(
  request: NextRequest,
): Promise<Session | null> {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
}

export function authenticationRequired(): NextResponse {
  return apiError(
    401,
    "AUTH_INVALID_CREDENTIALS",
    "Authentication is required.",
  );
}

export async function readJsonBody(request: NextRequest): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_JSON_BODY_BYTES) {
    throw new ZodError([
      {
        code: "custom",
        path: [],
        message: "The request body is too large.",
      },
    ]);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_JSON_BODY_BYTES) {
    throw new ZodError([
      {
        code: "custom",
        path: [],
        message: "The request body is too large.",
      },
    ]);
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new ZodError([
      {
        code: "custom",
        path: [],
        message: "The request body must contain valid JSON.",
      },
    ]);
  }
}

export function assertSameOrigin(
  request: NextRequest,
  permission: Permission = "MANAGE_DEVICES",
): void {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const rateLimit = checkMutationRateLimit(
      `${getRequestIp(request) ?? "local"}:${permission}`,
    );
    if (!rateLimit.allowed) {
      throw new MutationRateLimitError(rateLimit.retryAfterSeconds);
    }
  }

  const origin = request.headers.get("origin");
  if (!origin) return;

  const requestHost = (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host
  )
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new AuthorizationError(permission);
  }

  const originHost = originUrl.host.toLowerCase();
  const [requestHostname = "", requestPort = ""] =
    requestHost?.split(":") ?? [];
  const loopbackHostnames = new Set(["127.0.0.1", "localhost", "[::1]"]);
  const isEquivalentLoopback =
    loopbackHostnames.has(requestHostname) &&
    loopbackHostnames.has(originUrl.hostname) &&
    requestPort === originUrl.port;

  if (!requestHost || (originHost !== requestHost && !isEquivalentLoopback)) {
    throw new AuthorizationError(permission);
  }
}

export function getRequestIp(request: NextRequest): string | null {
  const value = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return value && isIP(value) > 0 ? value : null;
}

function zodFieldErrors(
  error: ZodError,
): Readonly<Record<string, readonly string[]>> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "request");
    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
  }

  return fieldErrors;
}

export function handleApiError(error: unknown): NextResponse {
  const correlationId = randomUUID();

  if (error instanceof ZodError) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "The request contains invalid values.",
      correlationId,
      zodFieldErrors(error),
    );
  }
  if (error instanceof AuthorizationError) {
    return apiError(
      403,
      "AUTH_FORBIDDEN",
      "You do not have permission to perform this action.",
      correlationId,
    );
  }
  if (error instanceof MutationRateLimitError) {
    const response = apiError(
      429,
      "RATE_LIMITED",
      "Too many mutation requests. Try again later.",
      correlationId,
    );
    response.headers.set("Retry-After", String(error.retryAfterSeconds));
    return response;
  }
  if (error instanceof DeviceNotFoundError) {
    return apiError(404, error.code, error.message, correlationId);
  }
  if (error instanceof DeviceConflictError) {
    return apiError(409, error.code, error.message, correlationId, {
      [error.field]: [error.message],
    });
  }
  if (error instanceof DeviceReferenceError) {
    return apiError(400, error.code, error.message, correlationId, {
      [error.field]: [error.message],
    });
  }
  if (error instanceof AlertNotFoundError) {
    return apiError(404, error.code, error.message, correlationId);
  }
  if (error instanceof AlertLifecycleError) {
    return apiError(
      error.code === "ALERT_OVERRIDE_REASON_REQUIRED" ? 400 : 409,
      error.code,
      error.message,
      correlationId,
    );
  }
  if (error instanceof AlertActiveConflictError) {
    return apiError(409, error.code, error.message, correlationId);
  }
  if (error instanceof SimulationError) {
    return apiError(error.status, error.code, error.message, correlationId);
  }

  logEvent("error", "api.request.failed", {
    correlationId,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return apiError(
    500,
    "INTERNAL_ERROR",
    "The request could not be completed.",
    correlationId,
  );
}
