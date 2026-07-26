import { config } from "dotenv";
import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it } from "vitest";

import { requireTestDatabaseUrl } from "@/lib/database-url";
import type { PublicUser } from "@/modules/identity/domain/user";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/modules/identity/infrastructure/session";
import { resetTestDatabase } from "@/scripts/reset-test-database";

config({ path: ".env.local", quiet: true });
process.env.DATABASE_URL = requireTestDatabaseUrl();
process.env.AUTH_SECRET =
  "alert-route-test-secret-longer-than-thirty-two-characters";

const users: Readonly<Record<"admin" | "engineer" | "viewer", PublicUser>> = {
  admin: {
    id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
    name: "Amina Al-Harthi",
    email: "admin@securenet.demo",
    role: "ADMIN",
  },
  engineer: {
    id: "6f3a8aa8-f6a1-4c24-9252-e49706dc973b",
    name: "Nasser Al-Balushi",
    email: "engineer@securenet.demo",
    role: "NETWORK_ENGINEER",
  },
  viewer: {
    id: "a8785311-78fa-4d3e-8f15-0511adb68597",
    name: "Maha Al-Rashdi",
    email: "viewer@securenet.demo",
    role: "VIEWER",
  },
};

async function request(
  path: string,
  user: PublicUser,
  init?: { readonly method?: string; readonly body?: string },
) {
  const token = await createSessionToken(user);
  return new NextRequest(`http://localhost${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
      origin: "http://localhost",
    },
  });
}

describe("Alert and Event routes", () => {
  beforeAll(async () => resetTestDatabase());

  it.each(Object.values(users))(
    "allows $role read access with filters and related-device contracts",
    async (user) => {
      const [{ GET: alertList }, { GET: eventList }, { GET: relatedAlerts }] =
        await Promise.all([
          import("@/app/api/v1/alerts/route"),
          import("@/app/api/v1/events/route"),
          import("@/app/api/v1/devices/[id]/alerts/route"),
        ]);
      const alerts = await alertList(
        await request("/api/v1/alerts?status=OPEN&pageSize=1", user),
      );
      const events = await eventList(
        await request("/api/v1/events?search=Alert&limit=2", user),
      );
      const related = await relatedAlerts(
        await request(
          "/api/v1/devices/30000000-0000-4000-8000-000000000002/alerts",
          user,
        ),
        {
          params: Promise.resolve({
            id: "30000000-0000-4000-8000-000000000002",
          }),
        },
      );
      expect(alerts.status).toBe(200);
      expect(events.status).toBe(200);
      expect(related.status).toBe(200);
    },
  );

  it("returns validation envelopes for malformed filters and cursors", async () => {
    const [{ GET: alertList }, { GET: eventList }] = await Promise.all([
      import("@/app/api/v1/alerts/route"),
      import("@/app/api/v1/events/route"),
    ]);
    const alerts = await alertList(
      await request("/api/v1/alerts?pageSize=101", users.viewer),
    );
    const events = await eventList(
      await request("/api/v1/events?cursor=not-a-cursor", users.viewer),
    );
    expect(alerts.status).toBe(400);
    expect(events.status).toBe(400);
    await expect(events.json()).resolves.toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: { cursor: expect.any(Array) },
      },
    });
  });

  it("enforces Viewer mutation denial and same-origin protection", async () => {
    const { POST } = await import("@/app/api/v1/alerts/[id]/acknowledge/route");
    const context = {
      params: Promise.resolve({
        id: "50000000-0000-4000-8000-000000000001",
      }),
    };
    const denied = await POST(
      await request(
        "/api/v1/alerts/50000000-0000-4000-8000-000000000001/acknowledge",
        users.viewer,
        { method: "POST", body: "{}" },
      ),
      context,
    );
    expect(denied.status).toBe(403);

    const token = await createSessionToken(users.admin);
    const crossOrigin = await POST(
      new NextRequest(
        "http://localhost/api/v1/alerts/50000000-0000-4000-8000-000000000001/acknowledge",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: `${SESSION_COOKIE_NAME}=${token}`,
            origin: "https://malicious.example",
          },
          body: "{}",
        },
      ),
      context,
    );
    expect(crossOrigin.status).toBe(403);
  });

  it("returns exact lifecycle error codes and permits canonical commands", async () => {
    const { POST: resolve } =
      await import("@/app/api/v1/alerts/[id]/resolve/route");
    const context = {
      params: Promise.resolve({
        id: "50000000-0000-4000-8000-000000000001",
      }),
    };
    const missingOverride = await resolve(
      await request(
        "/api/v1/alerts/50000000-0000-4000-8000-000000000001/resolve",
        users.admin,
        { method: "POST", body: "{}" },
      ),
      context,
    );
    expect(missingOverride.status).toBe(400);
    await expect(missingOverride.json()).resolves.toMatchObject({
      error: { code: "ALERT_OVERRIDE_REASON_REQUIRED" },
    });

    const resolved = await resolve(
      await request(
        "/api/v1/alerts/50000000-0000-4000-8000-000000000001/resolve",
        users.admin,
        {
          method: "POST",
          body: JSON.stringify({
            overrideReason: "Approved Demo incident override.",
          }),
        },
      ),
      context,
    );
    expect(resolved.status).toBe(200);
    await expect(resolved.json()).resolves.toMatchObject({
      data: { alert: { status: "RESOLVED" } },
    });
  });
});
