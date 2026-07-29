import { config } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { requireTestDatabaseUrl } from "@/lib/database-url";
import { resetTestDatabase } from "@/scripts/reset-test-database";

config({ path: ".env.local", quiet: true });
process.env.DATABASE_URL = requireTestDatabaseUrl();

let database: PrismaClient;
let Repository: typeof import("@/modules/monitoring/infrastructure/prisma-dashboard-repository").PrismaDashboardRepository;

describe("Prisma Dashboard repository", () => {
  beforeAll(async () => {
    await resetTestDatabase();
    ({ prisma: database } = await import("@/lib/prisma"));
    ({ PrismaDashboardRepository: Repository } =
      await import("@/modules/monitoring/infrastructure/prisma-dashboard-repository"));
  });

  afterAll(async () => database.$disconnect());

  it("returns persisted Demo counts, traffic, Alerts, Events, and incomplete health disclosure", async () => {
    const snapshot = await new Repository().getSnapshot();
    expect(snapshot.source).toBe("SIMULATION_DATABASE");
    expect(snapshot.summary).toMatchObject({
      totalDevices: 30,
      onlineDevices: 24,
      degradedDevices: 4,
      offlineDevices: 2,
      openCriticalAlerts: 3,
    });
    expect(snapshot.traffic.length).toBeGreaterThan(0);
    expect(snapshot.latestAlerts.length).toBeGreaterThan(0);
    expect(snapshot.recentEvents.length).toBeGreaterThan(0);
    expect(snapshot.networkHealth).toMatchObject({
      formulaComplete: false,
      unresolvedFactors: [
        "AVERAGE_PACKET_LOSS",
        "AVERAGE_PING",
        "DEGRADED_DEVICE_RATIO",
      ],
    });
  });
});
