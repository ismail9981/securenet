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
  "sprint-six-route-secret-longer-than-thirty-two-characters";

const admin: PublicUser = {
  id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
  name: "Administrator",
  email: "admin@securenet.demo",
  role: "ADMIN",
};
const viewer: PublicUser = {
  id: "a8785311-78fa-4d3e-8f15-0511adb68597",
  name: "Viewer",
  email: "viewer@securenet.demo",
  role: "VIEWER",
};

async function request(
  path: string,
  user: PublicUser,
  init?: {
    readonly method?: string;
    readonly body?: string;
    readonly headers?: Readonly<Record<string, string>>;
  },
): Promise<NextRequest> {
  const token = await createSessionToken(user);
  return new NextRequest(`http://localhost${path}`, {
    ...init,
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
      origin: "http://localhost",
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

describe("Sprint 6 routes", () => {
  beforeAll(resetTestDatabase);

  it.each([admin, viewer])(
    "allows $role to view reports and settings",
    async (user) => {
      const [{ GET: report }, { GET: settings }] = await Promise.all([
        import("@/app/api/v1/reports/network-health/route"),
        import("@/app/api/v1/settings/route"),
      ]);
      expect(
        (await report(await request("/api/v1/reports/network-health", user)))
          .status,
      ).toBe(200);
      expect(
        (await settings(await request("/api/v1/settings", user))).status,
      ).toBe(200);
    },
  );

  it("serves a secure CSV attachment", async () => {
    const { GET } = await import("@/app/api/v1/reports/alerts.csv/route");
    const response = await GET(
      await request("/api/v1/reports/alerts.csv", viewer),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/csv; charset=utf-8",
    );
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="securenet-alerts-/,
    );
    expect([
      ...new Uint8Array(await response.arrayBuffer()).slice(0, 3),
    ]).toEqual([0xef, 0xbb, 0xbf]);
  });

  it("enforces Administrator-only settings and AlertRule mutation", async () => {
    const [{ PUT }, { PATCH }] = await Promise.all([
      import("@/app/api/v1/settings/route"),
      import("@/app/api/v1/alert-rules/[id]/route"),
    ]);
    const payload = JSON.stringify({
      timezone: "Asia/Muscat",
      cpuUnit: "percent",
      memoryUnit: "percent",
      trafficUnit: "Mbps",
    });
    expect(
      (
        await PUT(
          await request("/api/v1/settings", viewer, {
            method: "PUT",
            body: payload,
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await PUT(
          await request("/api/v1/settings", admin, {
            method: "PUT",
            body: payload,
          }),
        )
      ).status,
    ).toBe(200);
    const ruleId = "40000000-0000-4000-8000-000000000001";
    const response = await PATCH(
      await request(`/api/v1/alert-rules/${ruleId}`, viewer, {
        method: "PATCH",
        body: JSON.stringify({ durationSeconds: 5 }),
      }),
      { params: Promise.resolve({ id: ruleId }) },
    );
    expect(response.status).toBe(403);
  });

  it("rejects immutable AlertRule fields and AR-BW-01 activation", async () => {
    const { PATCH } = await import("@/app/api/v1/alert-rules/[id]/route");
    const immutable = await PATCH(
      await request(
        "/api/v1/alert-rules/40000000-0000-4000-8000-000000000001",
        admin,
        { method: "PATCH", body: JSON.stringify({ code: "CHANGED" }) },
      ),
      {
        params: Promise.resolve({
          id: "40000000-0000-4000-8000-000000000001",
        }),
      },
    );
    const bandwidth = await PATCH(
      await request(
        "/api/v1/alert-rules/40000000-0000-4000-8000-000000000007",
        admin,
        { method: "PATCH", body: JSON.stringify({ enabled: true }) },
      ),
      {
        params: Promise.resolve({
          id: "40000000-0000-4000-8000-000000000007",
        }),
      },
    );
    expect(immutable.status).toBe(400);
    expect(bandwidth.status).toBe(400);
  });

  it("enforces Topology save RBAC and payload validation", async () => {
    const { PUT } = await import("@/app/api/v1/topology/positions/route");
    const body = JSON.stringify({
      positions: [
        {
          deviceId: "30000000-0000-4000-8000-000000000001",
          x: 100,
          y: 200,
        },
      ],
    });
    expect(
      (
        await PUT(
          await request("/api/v1/topology/positions", viewer, {
            method: "PUT",
            body,
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await PUT(
          await request("/api/v1/topology/positions", admin, {
            method: "PUT",
            body,
          }),
        )
      ).status,
    ).toBe(200);
  });
});
