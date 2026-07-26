import { config } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { requireTestDatabaseUrl } from "@/lib/database-url";
import type { TopologyService } from "@/modules/topology/application/topology-service";
import { seedDatabase } from "@/prisma/seed";
import { resetTestDatabase } from "@/scripts/reset-test-database";

config({ path: ".env.local", quiet: true });
process.env.DATABASE_URL = requireTestDatabaseUrl();

const actor = {
  id: "a8785311-78fa-4d3e-8f15-0511adb68597",
  name: "Maha Al-Rashdi",
  email: "viewer@securenet.demo",
  role: "VIEWER" as const,
};

let database: PrismaClient;
let service: TopologyService;

describe("Prisma topology repository", () => {
  beforeAll(async () => {
    await resetTestDatabase();
    ({ prisma: database } = await import("@/lib/prisma"));
    ({ topologyService: service } =
      await import("@/modules/topology/infrastructure/topology-service"));
  });

  afterAll(async () => database.$disconnect());

  it("returns 30 active nodes and deterministic undirected links", async () => {
    const snapshot = await service.getActiveSnapshot({ actor });
    expect(snapshot.nodes).toHaveLength(30);
    expect(snapshot.links).toHaveLength(29);
    expect(
      snapshot.links.every((link) => link.bandwidthCapacityMbps === null),
    ).toBe(true);
    expect(snapshot.nodes.some((node) => node.hostname === "RTR-CORE-01")).toBe(
      true,
    );
  });

  it("keeps orphan nodes and excludes archived Devices and affected links", async () => {
    const orphan = await database.device.create({
      data: {
        name: "Orphan fixture",
        hostname: "ORPHAN-01",
        ipAddress: "10.99.80.1",
        type: "SERVER",
        status: "UNKNOWN",
        locationId: "10000000-0000-4000-8000-000000000001",
      },
    });
    await database.device.update({
      where: { id: "30000000-0000-4000-8000-000000000002" },
      data: { archivedAt: new Date() },
    });
    const snapshot = await service.getActiveSnapshot({ actor });

    expect(snapshot.nodes.some((node) => node.id === orphan.id)).toBe(true);
    expect(
      snapshot.nodes.some(
        (node) => node.id === "30000000-0000-4000-8000-000000000002",
      ),
    ).toBe(false);
    expect(
      snapshot.links.some(
        (link) =>
          link.sourceDeviceId === "30000000-0000-4000-8000-000000000002" ||
          link.targetDeviceId === "30000000-0000-4000-8000-000000000002",
      ),
    ).toBe(false);
    expect(
      await database.networkConnection.count({
        where: {
          OR: [
            {
              sourceDeviceId: "30000000-0000-4000-8000-000000000002",
            },
            {
              targetDeviceId: "30000000-0000-4000-8000-000000000002",
            },
          ],
        },
      }),
    ).toBeGreaterThan(0);
  });

  it("enforces self-link and reverse-duplicate constraints while allowing cycles", async () => {
    await resetTestDatabase();
    await expect(
      database.$executeRawUnsafe(
        `INSERT INTO network_connections
          (id, source_device_id, target_device_id, connection_type, status, updated_at)
         VALUES
          ('60000000-0000-4000-8000-000000000090',
           '30000000-0000-4000-8000-000000000001',
           '30000000-0000-4000-8000-000000000001',
           'ETHERNET', 'ACTIVE', NOW())`,
      ),
    ).rejects.toThrow();
    await expect(
      database.$executeRawUnsafe(
        `INSERT INTO network_connections
          (id, source_device_id, target_device_id, connection_type, status, updated_at)
         VALUES
          ('60000000-0000-4000-8000-000000000091',
           '30000000-0000-4000-8000-000000000002',
           '30000000-0000-4000-8000-000000000001',
           'ETHERNET', 'ACTIVE', NOW())`,
      ),
    ).rejects.toThrow();
    await expect(
      database.networkConnection.create({
        data: {
          id: "60000000-0000-4000-8000-000000000092",
          sourceDeviceId: "30000000-0000-4000-8000-000000000001",
          targetDeviceId: "30000000-0000-4000-8000-000000000004",
          connectionType: "VIRTUAL",
          status: "ACTIVE",
        },
      }),
    ).resolves.toMatchObject({ connectionType: "VIRTUAL" });
  });

  it("seeds idempotently with stable connection counts", async () => {
    await resetTestDatabase();
    await seedDatabase(database);
    const first = await database.networkConnection.count();
    await seedDatabase(database);
    const second = await database.networkConnection.count();
    expect([first, second]).toEqual([29, 29]);
  });
});
