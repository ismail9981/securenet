import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicUser } from "@/modules/identity/domain/user";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/modules/identity/infrastructure/session";

const admin: PublicUser = {
  id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
  name: "Amina Al-Harthi",
  email: "admin@securenet.demo",
  role: "ADMIN",
};
const originalEnvironment = { ...process.env };

async function authenticatedRequest(path: string): Promise<NextRequest> {
  const token = await createSessionToken(admin);
  return new NextRequest(`https://portfolio.example${path}`, {
    method: "POST",
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${token}`,
      origin: "https://portfolio.example",
      "content-type": "application/json",
      "idempotency-key": "portfolio-unavailable-001",
    },
    body: JSON.stringify({
      scenarioCode: "SIM-CPU-OVERLOAD",
      targetDeviceIds: ["30000000-0000-4000-8000-000000000008"],
    }),
  });
}

describe("Portfolio mode without a simulation Worker", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.AUTH_SECRET =
      "portfolio-test-secret-longer-than-thirty-two-characters";
    process.env.DATABASE_URL =
      "postgresql://safe-placeholder@ep-example.us-east-2.aws.neon.tech/securenet_portfolio";
    process.env.SECURENET_DEPLOYMENT_ENV = "production-demo";
    process.env.SECURENET_PORTFOLIO_MODE = "true";
    process.env.SECURENET_PRODUCTION_DATABASE_NAME = "securenet_portfolio";
    process.env.SEED_DEMO_PASSWORD = "portfolio-demo-password";
    delete process.env.TEST_DATABASE_URL;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnvironment)) delete process.env[key];
    }
    Object.assign(process.env, originalEnvironment);
  });

  it("rejects start and cancel commands without accessing a Worker", async () => {
    const [{ POST: startSimulation }, { POST: cancelSimulation }] =
      await Promise.all([
        import("@/app/api/v1/simulation/runs/route"),
        import("@/app/api/v1/simulation/runs/[id]/cancel/route"),
      ]);
    const start = await startSimulation(
      await authenticatedRequest("/api/v1/simulation/runs"),
    );
    expect(start.status).toBe(503);
    await expect(start.json()).resolves.toMatchObject({
      error: { code: "SIMULATION_WORKER_UNAVAILABLE" },
    });

    const id = "70000000-0000-4000-8000-000000000001";
    const cancel = await cancelSimulation(
      await authenticatedRequest(`/api/v1/simulation/runs/${id}/cancel`),
      { params: Promise.resolve({ id }) },
    );
    expect(cancel.status).toBe(503);
    await expect(cancel.json()).resolves.toMatchObject({
      error: { code: "SIMULATION_WORKER_UNAVAILABLE" },
    });
  });
});
