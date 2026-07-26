import { config } from "dotenv";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { requireTestDatabaseUrl } from "@/lib/database-url";
import type { PublicUser } from "@/modules/identity/domain/user";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/modules/identity/infrastructure/session";
import {
  HEARTBEAT_INTERVAL_MS,
  RECONNECT_DELAY_MS,
} from "@/modules/realtime/application/realtime-contracts";
import { realtimeHub } from "@/modules/realtime/infrastructure/in-process-realtime-publisher";
import { resetTestDatabase } from "@/scripts/reset-test-database";

config({ path: ".env.local", quiet: true });
process.env.DATABASE_URL = requireTestDatabaseUrl();

const SECRET = "topology-route-secret-longer-than-thirty-two-characters";
const users: PublicUser[] = [
  {
    id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
    name: "Amina Al-Harthi",
    email: "admin@securenet.demo",
    role: "ADMIN",
  },
  {
    id: "6f3a8aa8-f6a1-4c24-9252-e49706dc973b",
    name: "Nasser Al-Balushi",
    email: "engineer@securenet.demo",
    role: "NETWORK_ENGINEER",
  },
  {
    id: "a8785311-78fa-4d3e-8f15-0511adb68597",
    name: "Maha Al-Rashdi",
    email: "viewer@securenet.demo",
    role: "VIEWER",
  },
];
let realtime: typeof import("@/app/api/v1/realtime/route").GET;
let topology: typeof import("@/app/api/v1/topology/route").GET;

async function authenticatedRequest(
  path: string,
  user = users[0] as PublicUser,
  headers: Readonly<Record<string, string>> = {},
) {
  const token = await createSessionToken(user);
  return new NextRequest(`http://localhost${path}`, {
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
  });
}

describe("Topology and realtime routes", () => {
  beforeAll(async () => {
    process.env.AUTH_SECRET = SECRET;
    await resetTestDatabase();
    ({ GET: realtime } = await import("@/app/api/v1/realtime/route"));
    ({ GET: topology } = await import("@/app/api/v1/topology/route"));
  });

  beforeEach(() => realtimeHub.resetForTests());

  it.each(users)(
    "allows $role to read the active Topology DTO",
    async (user) => {
      const response = await topology(
        await authenticatedRequest("/api/v1/topology", user),
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        data: {
          generatedAt: expect.any(String),
          nodes: expect.arrayContaining([
            expect.objectContaining({
              hostname: "SEC-FW-01",
              type: "FIREWALL",
              status: "ONLINE",
            }),
          ]),
          links: expect.arrayContaining([
            expect.objectContaining({
              connectionType: expect.any(String),
              bandwidthCapacityMbps: null,
            }),
          ]),
        },
      });
    },
  );

  it("returns the standard authentication envelope without a session", async () => {
    const response = await topology(
      new NextRequest("http://localhost/api/v1/topology"),
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "AUTH_INVALID_CREDENTIALS",
        correlationId: expect.any(String),
      },
    });
  });

  it("streams SSE only for an authenticated same-origin session", async () => {
    const response = await realtime(
      await authenticatedRequest("/api/v1/realtime"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const reader = response.body?.getReader();
    const chunk = await reader?.read();
    expect(new TextDecoder().decode(chunk?.value)).toContain(
      `retry: ${RECONNECT_DELAY_MS}`,
    );
    await reader?.cancel();

    const crossOrigin = await realtime(
      await authenticatedRequest("/api/v1/realtime", users[0], {
        origin: "https://attacker.example",
        "sec-fetch-site": "cross-site",
      }),
    );
    expect(crossOrigin.status).toBe(403);

    const forged = await realtime(
      new NextRequest("http://localhost/api/v1/realtime", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=forged`,
          origin: "http://localhost",
          "sec-fetch-site": "same-origin",
        },
      }),
    );
    expect(forged.status).toBe(401);
  });

  it("rejects expired sessions", async () => {
    const token = await new SignJWT({
      name: users[0]?.name,
      email: users[0]?.email,
      role: users[0]?.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(users[0]?.id ?? "")
      .setIssuedAt(1)
      .setExpirationTime(2)
      .sign(new TextEncoder().encode(SECRET));
    const response = await realtime(
      new NextRequest("http://localhost/api/v1/realtime", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=${token}`,
          origin: "http://localhost",
          "sec-fetch-site": "same-origin",
        },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("limits each user to three streams and documents the heartbeat budget", async () => {
    const responses = await Promise.all(
      [1, 2, 3].map(async () =>
        realtime(await authenticatedRequest("/api/v1/realtime")),
      ),
    );
    const limited = await realtime(
      await authenticatedRequest("/api/v1/realtime"),
    );
    expect(responses.map(({ status }) => status)).toEqual([200, 200, 200]);
    expect(limited.status).toBe(429);
    expect(HEARTBEAT_INTERVAL_MS).toBe(20_000);
    await Promise.all(responses.map(({ body }) => body?.cancel()));
  });
});
