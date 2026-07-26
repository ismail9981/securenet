import { config } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { requireTestDatabaseUrl } from "@/lib/database-url";
import type { DeviceService } from "@/modules/inventory/application/device-service";
import {
  DeviceConflictError,
  DeviceNotFoundError,
} from "@/modules/inventory/application/device-errors";
import type { PublicUser } from "@/modules/identity/domain/user";
import { realtimeHub } from "@/modules/realtime/infrastructure/in-process-realtime-publisher";
import { resetTestDatabase } from "@/scripts/reset-test-database";

config({ path: ".env.local", quiet: true });
process.env.DATABASE_URL = requireTestDatabaseUrl();

const admin: PublicUser = {
  id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
  name: "Amina Al-Harthi",
  email: "admin@securenet.demo",
  role: "ADMIN",
};

const mutationContext = { actor: admin, requestIp: "198.51.100.40" };
const locationId = "10000000-0000-4000-8000-000000000001";

let service: DeviceService;
let database: PrismaClient;

describe("Prisma device repository", () => {
  beforeAll(async () => {
    await resetTestDatabase();
    ({ deviceService: service } =
      await import("@/modules/inventory/infrastructure/device-service"));
    ({ prisma: database } = await import("@/lib/prisma"));
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("lists the 30 seeded devices and searches by exact IP", async () => {
    const all = await service.list(
      {
        search: "",
        statuses: [],
        types: [],
        sort: "name",
        order: "asc",
        page: 1,
        pageSize: 100,
      },
      { actor: admin },
    );
    const search = await service.list(
      {
        search: "10.20.0.2",
        statuses: [],
        types: [],
        sort: "name",
        order: "asc",
        page: 1,
        pageSize: 20,
      },
      { actor: admin },
    );

    expect(all.meta.total).toBe(30);
    expect(search.data).toHaveLength(1);
    expect(search.data[0]?.hostname).toBe("RTR-CORE-01");
    expect(search.data[0]?.activeAlertCount).toBe(1);
  });

  it("returns 24 persisted metric fixtures with source and received time", async () => {
    const metrics = await service.getMetrics(
      "30000000-0000-4000-8000-000000000001",
      { limit: 24 },
      { actor: admin },
    );

    expect(metrics.data).toHaveLength(24);
    expect(metrics.data[0]).toMatchObject({
      sourceTime: expect.any(String),
      receivedAt: expect.any(String),
      uptimeSeconds: expect.any(Number),
    });
  });

  it("returns distinct approved conflicts for active hostname and IP", async () => {
    const base = {
      name: "Duplicate Fixture",
      hostname: "RTR-CORE-01",
      ipAddress: "10.99.0.1",
      macAddress: null,
      type: "ROUTER" as const,
      status: "ONLINE" as const,
      osName: null,
      locationId,
      parentDeviceId: null,
      importanceWeight: 3,
    };

    await expect(service.create(base, mutationContext)).rejects.toMatchObject({
      code: "DEVICE_HOSTNAME_CONFLICT",
    } satisfies Partial<DeviceConflictError>);
    await expect(
      service.create(
        { ...base, hostname: "RTR-UNIQUE-01", ipAddress: "10.20.0.2" },
        mutationContext,
      ),
    ).rejects.toMatchObject({
      code: "DEVICE_IP_CONFLICT",
    } satisfies Partial<DeviceConflictError>);
  });

  it("creates, updates, and archives atomically with audit history", async () => {
    const published: string[] = [];
    const release = realtimeHub.subscribe(admin.id, (envelope) =>
      published.push(envelope.eventType),
    );
    const created = await service.create(
      {
        name: "Audit Test Server",
        hostname: "SRV-AUDIT-01",
        ipAddress: "10.99.1.10",
        macAddress: "02:00:00:00:99:10",
        type: "SERVER",
        status: "UNKNOWN",
        osName: "Linux LTS",
        locationId,
        parentDeviceId: null,
        importanceWeight: 2,
      },
      mutationContext,
    );
    const updated = await service.update(
      created.id,
      { status: "ONLINE", name: "Audited Server" },
      mutationContext,
    );
    const archived = await service.archive(created.id, true, mutationContext);

    expect(updated.name).toBe("Audited Server");
    expect(archived.id).toBe(created.id);
    await expect(
      service.getById(created.id, { actor: admin }),
    ).rejects.toBeInstanceOf(DeviceNotFoundError);
    expect(
      await database.auditLog.count({ where: { entityId: created.id } }),
    ).toBe(3);
    expect(
      await database.event.count({ where: { deviceId: created.id } }),
    ).toBe(4);
    expect(
      await database.device.count({
        where: { id: created.id, archivedAt: { not: null } },
      }),
    ).toBe(1);
    expect(published).toEqual(
      expect.arrayContaining(["device.updated", "event.created"]),
    );
    release?.();
  });
});
