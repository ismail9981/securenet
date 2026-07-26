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
  "device-route-test-secret-longer-than-thirty-two-characters";

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
      "content-type": "application/json",
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
      origin: "http://localhost",
      ...(init?.headers ?? {}),
    },
  });
}

describe("device routes", () => {
  beforeAll(async () => {
    await resetTestDatabase();
  });

  it.each(Object.values(users))(
    "allows $role to read device inventory and metrics",
    async (user) => {
      const [{ GET: list }, { GET: metrics }] = await Promise.all([
        import("@/app/api/v1/devices/route"),
        import("@/app/api/v1/devices/[id]/metrics/route"),
      ]);

      const listResponse = await list(
        await request("/api/v1/devices?search=10.20.0.2", user),
      );
      const metricResponse = await metrics(
        await request(
          "/api/v1/devices/30000000-0000-4000-8000-000000000001/metrics?limit=5",
          user,
        ),
        {
          params: Promise.resolve({
            id: "30000000-0000-4000-8000-000000000001",
          }),
        },
      );

      expect(listResponse.status).toBe(200);
      expect(metricResponse.status).toBe(200);
      await expect(listResponse.json()).resolves.toMatchObject({
        data: [{ hostname: "RTR-CORE-01", activeAlertCount: null }],
      });
      await expect(metricResponse.json()).resolves.toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({ sourceTime: expect.any(String) }),
        ]),
      });
    },
  );

  it.each([users.engineer, users.viewer])(
    "returns 403 and makes no change when $role creates a device",
    async (user) => {
      const { POST } = await import("@/app/api/v1/devices/route");
      const response = await POST(
        await request("/api/v1/devices", user, {
          method: "POST",
          body: JSON.stringify({
            name: "Forbidden Device",
            hostname: `FORBIDDEN-${user.role}`,
            ipAddress: user.role === "VIEWER" ? "10.99.2.20" : "10.99.2.21",
            type: "SERVER",
            status: "UNKNOWN",
            locationId: "10000000-0000-4000-8000-000000000001",
            importanceWeight: 1,
          }),
        }),
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({
        error: { code: "AUTH_FORBIDDEN" },
      });
    },
  );

  it.each([users.engineer, users.viewer])(
    "returns 403 when $role attempts update or archive",
    async (user) => {
      const { DELETE, PATCH } = await import("@/app/api/v1/devices/[id]/route");
      const id = "30000000-0000-4000-8000-000000000002";
      const context = { params: Promise.resolve({ id }) };
      const updated = await PATCH(
        await request(`/api/v1/devices/${id}`, user, {
          method: "PATCH",
          body: JSON.stringify({ name: "Forbidden update" }),
        }),
        context,
      );
      const archived = await DELETE(
        await request(`/api/v1/devices/${id}`, user, {
          method: "DELETE",
          body: JSON.stringify({ confirmed: true }),
        }),
        context,
      );

      expect(updated.status).toBe(403);
      expect(archived.status).toBe(403);
    },
  );

  it("allows Administrator create and returns exact 409 conflict codes", async () => {
    const { POST } = await import("@/app/api/v1/devices/route");
    const payload = {
      name: "Route Test Device",
      hostname: "SRV-ROUTE-01",
      ipAddress: "10.99.3.10",
      type: "SERVER",
      status: "ONLINE",
      locationId: "10000000-0000-4000-8000-000000000001",
      importanceWeight: 2,
    };
    const created = await POST(
      await request("/api/v1/devices", users.admin, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    const hostnameConflict = await POST(
      await request("/api/v1/devices", users.admin, {
        method: "POST",
        body: JSON.stringify({ ...payload, ipAddress: "10.99.3.11" }),
      }),
    );
    const ipConflict = await POST(
      await request("/api/v1/devices", users.admin, {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          hostname: "SRV-ROUTE-02",
        }),
      }),
    );

    expect(created.status).toBe(201);
    expect(hostnameConflict.status).toBe(409);
    expect(ipConflict.status).toBe(409);
    await expect(hostnameConflict.json()).resolves.toMatchObject({
      error: { code: "DEVICE_HOSTNAME_CONFLICT" },
    });
    await expect(ipConflict.json()).resolves.toMatchObject({
      error: { code: "DEVICE_IP_CONFLICT" },
    });
  });

  it("requires confirmed soft archive and never deletes metrics", async () => {
    const { DELETE } = await import("@/app/api/v1/devices/[id]/route");
    const id = "30000000-0000-4000-8000-000000000001";
    const context = { params: Promise.resolve({ id }) };
    const unconfirmed = await DELETE(
      await request(`/api/v1/devices/${id}`, users.admin, {
        method: "DELETE",
        body: JSON.stringify({ confirmed: false }),
      }),
      context,
    );
    const archived = await DELETE(
      await request(`/api/v1/devices/${id}`, users.admin, {
        method: "DELETE",
        body: JSON.stringify({ confirmed: true }),
      }),
      context,
    );

    expect(unconfirmed.status).toBe(400);
    expect(archived.status).toBe(200);

    const { prisma } = await import("@/lib/prisma");
    expect(await prisma.deviceMetric.count({ where: { deviceId: id } })).toBe(
      24,
    );
    expect(
      await prisma.auditLog.count({
        where: { entityId: id, action: "device.archived" },
      }),
    ).toBe(1);
  });

  it("rejects cross-origin Administrator mutations", async () => {
    const { POST } = await import("@/app/api/v1/devices/route");
    const response = await POST(
      await request("/api/v1/devices", users.admin, {
        method: "POST",
        headers: { origin: "https://malicious.example" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("rejects malformed origins without exposing an internal error", async () => {
    const { POST } = await import("@/app/api/v1/devices/route");
    const response = await POST(
      await request("/api/v1/devices", users.admin, {
        method: "POST",
        headers: { origin: "not a valid origin" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "AUTH_FORBIDDEN" },
    });
  });
});
