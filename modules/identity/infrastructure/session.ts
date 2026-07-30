import { jwtVerify, SignJWT } from "jose";

import type { PublicUser } from "@/modules/identity/domain/user";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/modules/identity/infrastructure/session-constants";
import { userRoleSchema } from "@/modules/shared/domain/network";

export { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS };

export interface Session {
  readonly user: PublicUser;
  readonly expiresAt: string;
}

function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: PublicUser): Promise<string> {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .setJti(crypto.randomUUID())
    .sign(getSessionSecret());
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });
    const role = userRoleSchema.parse(payload.role);

    if (
      !payload.sub ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    return {
      user: {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role,
      },
      expiresAt: new Date(payload.exp * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.SECURENET_DEPLOYMENT_ENV !== "test",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}
