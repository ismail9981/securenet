import { config } from "dotenv";
import { NextRequest } from "next/server";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { requireTestDatabaseUrl } from "@/lib/database-url";
import type { PublicUser } from "@/modules/identity/domain/user";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/modules/identity/infrastructure/session";
import { resetSimulationRateLimitForTests } from "@/modules/simulation/infrastructure/simulation-rate-limit";
import { resetTestDatabase } from "@/scripts/reset-test-database";

config({ path: ".env.local", quiet: true });
process.env.DATABASE_URL = requireTestDatabaseUrl();
process.env.AUTH_SECRET =
  "simulation-route-secret-longer-than-thirty-two-characters";

const admin: PublicUser = {
  id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
  name: "Amina Al-Harthi",
  email: "admin@securenet.demo",
  role: "ADMIN",
};
const engineer: PublicUser = {
  id: "6f3a8aa8-f6a1-4c24-9252-e49706dc973b",
  name: "Nasser Al-Balushi",
  email: "engineer@securenet.demo",
  role: "NETWORK_ENGINEER",
};
const serverId = "30000000-0000-4000-8000-000000000008";

let startRoute: typeof import("@/app/api/v1/simulation/runs/route").POST;
let getRoute: typeof import("@/app/api/v1/simulation/runs/[id]/route").GET;
let cancelRoute: typeof import("@/app/api/v1/simulation/runs/[id]/cancel/route").POST;

async function request(
  path: string,
  options: {
    readonly user?: PublicUser;
    readonly method?: string;
    readonly body?: unknown;
    readonly origin?: string;
    readonly idempotencyKey?: string;
  } = {},
) {
  const headers = new Headers();
  if (options.user) {
    const token = await createSessionToken(options.user);
    headers.set("cookie", `${SESSION_COOKIE_NAME}=${token}`);
  }
  headers.set("origin", options.origin ?? "http://localhost");
  headers.set("content-type", "application/json");
  if (options.idempotencyKey) {
    headers.set("idempotency-key", options.idempotencyKey);
  }
  return new NextRequest(`http://localhost${path}`, {
    method: options.method ?? "GET",
    headers,
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });
}

describe("simulation routes", () => {
  beforeAll(async () => {
    await resetTestDatabase();
    ({ POST: startRoute } = await import("@/app/api/v1/simulation/runs/route"));
    ({ GET: getRoute } =
      await import("@/app/api/v1/simulation/runs/[id]/route"));
    ({ POST: cancelRoute } =
      await import("@/app/api/v1/simulation/runs/[id]/cancel/route"));
  });

  beforeEach(() => resetSimulationRateLimitForTests());

  it("requires authentication and Administrator authorization", async () => {
    const unauthenticated = await startRoute(
      await request("/api/v1/simulation/runs", {
        method: "POST",
        body: {
          scenarioCode: "SIM-CPU-OVERLOAD",
          targetDeviceIds: [serverId],
        },
        idempotencyKey: "route-auth-001",
      }),
    );
    expect(unauthenticated.status).toBe(401);

    const forbidden = await startRoute(
      await request("/api/v1/simulation/runs", {
        user: engineer,
        method: "POST",
        body: {
          scenarioCode: "SIM-CPU-OVERLOAD",
          targetDeviceIds: [serverId],
        },
        idempotencyKey: "route-auth-002",
      }),
    );
    expect(forbidden.status).toBe(403);
  });

  it("rejects cross-origin and unsupported scenario requests", async () => {
    const crossOrigin = await startRoute(
      await request("/api/v1/simulation/runs", {
        user: admin,
        method: "POST",
        origin: "https://attacker.example",
        body: {
          scenarioCode: "SIM-CPU-OVERLOAD",
          targetDeviceIds: [serverId],
        },
        idempotencyKey: "route-origin-001",
      }),
    );
    expect(crossOrigin.status).toBe(403);

    const unsupported = await startRoute(
      await request("/api/v1/simulation/runs", {
        user: admin,
        method: "POST",
        body: {
          scenarioCode: "SIM-MULTI-FAIL",
          targetDeviceIds: [serverId],
        },
        idempotencyKey: "route-invalid-001",
      }),
    );
    expect(unsupported.status).toBe(400);
    await expect(unsupported.json()).resolves.toMatchObject({
      error: { code: "SIMULATION_SCENARIO_UNSUPPORTED" },
    });
  });

  it("starts, replays idempotently, reads, and cancels a run", async () => {
    const body = {
      scenarioCode: "SIM-CPU-OVERLOAD",
      targetDeviceIds: [serverId],
      seed: 123456,
    };
    const first = await startRoute(
      await request("/api/v1/simulation/runs", {
        user: admin,
        method: "POST",
        body,
        idempotencyKey: "route-lifecycle-001",
      }),
    );
    expect(first.status).toBe(201);
    const firstBody = (await first.json()) as { data: { id: string } };

    const replay = await startRoute(
      await request("/api/v1/simulation/runs", {
        user: admin,
        method: "POST",
        body,
        idempotencyKey: "route-lifecycle-001",
      }),
    );
    expect(replay.status).toBe(201);
    await expect(replay.json()).resolves.toMatchObject({
      data: { id: firstBody.data.id, seed: 123456, status: "RUNNING" },
    });

    const read = await getRoute(
      await request(`/api/v1/simulation/runs/${firstBody.data.id}`, {
        user: admin,
      }),
      { params: Promise.resolve({ id: firstBody.data.id }) },
    );
    expect(read.status).toBe(200);

    const cancelled = await cancelRoute(
      await request(`/api/v1/simulation/runs/${firstBody.data.id}/cancel`, {
        user: admin,
        method: "POST",
      }),
      { params: Promise.resolve({ id: firstBody.data.id }) },
    );
    expect(cancelled.status).toBe(200);
    await expect(cancelled.json()).resolves.toMatchObject({
      data: { status: "CANCELLED" },
    });
  });

  it("returns stable conflict and not-found errors", async () => {
    const missingId = "90000000-0000-4000-8000-000000000001";
    const missing = await getRoute(
      await request(`/api/v1/simulation/runs/${missingId}`, { user: admin }),
      { params: Promise.resolve({ id: missingId }) },
    );
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({
      error: { code: "SIMULATION_RUN_NOT_FOUND" },
    });

    const body = {
      scenarioCode: "SIM-RAM-LEAK",
      targetDeviceIds: [serverId],
      seed: 10,
    };
    await startRoute(
      await request("/api/v1/simulation/runs", {
        user: admin,
        method: "POST",
        body,
        idempotencyKey: "route-conflict-001",
      }),
    );
    const conflict = await startRoute(
      await request("/api/v1/simulation/runs", {
        user: admin,
        method: "POST",
        body: { ...body, seed: 11 },
        idempotencyKey: "route-conflict-001",
      }),
    );
    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toMatchObject({
      error: { code: "SIMULATION_IDEMPOTENCY_CONFLICT" },
    });
  });
});
