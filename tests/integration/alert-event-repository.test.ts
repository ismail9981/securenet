import { config } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { requireTestDatabaseUrl } from "@/lib/database-url";
import type { AlertService } from "@/modules/alerting/application/alert-service";
import type { EventService } from "@/modules/event-log/application/event-service";
import type { DeviceService } from "@/modules/inventory/application/device-service";
import type { PublicUser } from "@/modules/identity/domain/user";
import { resetTestDatabase } from "@/scripts/reset-test-database";

config({ path: ".env.local", quiet: true });
process.env.DATABASE_URL = requireTestDatabaseUrl();

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
const viewer: PublicUser = {
  id: "a8785311-78fa-4d3e-8f15-0511adb68597",
  name: "Maha Al-Rashdi",
  email: "viewer@securenet.demo",
  role: "VIEWER",
};
const context = (actor: PublicUser) => ({
  actor,
  requestIp: "198.51.100.45",
});
const listQuery: {
  page: number;
  pageSize: number;
  severities: ("INFO" | "WARNING" | "CRITICAL")[];
  statuses: ("OPEN" | "ACKNOWLEDGED" | "INVESTIGATING" | "RESOLVED")[];
} = {
  page: 1,
  pageSize: 20,
  severities: [],
  statuses: [],
};

let alerts: AlertService;
let events: EventService;
let devices: DeviceService;
let database: PrismaClient;

describe("Alert and Event repositories", () => {
  beforeAll(async () => {
    await resetTestDatabase();
    ({ alertService: alerts } =
      await import("@/modules/alerting/infrastructure/alert-service"));
    ({ eventService: events } =
      await import("@/modules/event-log/infrastructure/event-service"));
    ({ deviceService: devices } =
      await import("@/modules/inventory/infrastructure/device-service"));
    ({ prisma: database } = await import("@/lib/prisma"));
  });

  afterAll(async () => database?.$disconnect());

  it("lists and filters deterministic Alerts and cursor-paginates Events", async () => {
    const alertPage = await alerts.list(
      { ...listQuery, statuses: ["OPEN"] },
      { actor: viewer },
    );
    const firstEvents = await events.list(
      {
        limit: 2,
        types: [],
        severities: [],
        search: "",
      },
      { actor: viewer },
    );
    const secondEvents = await events.list(
      {
        limit: 2,
        ...(firstEvents.meta.nextCursor
          ? { cursor: firstEvents.meta.nextCursor }
          : {}),
        types: [],
        severities: [],
        search: "",
      },
      { actor: viewer },
    );
    expect(alertPage.data).toHaveLength(1);
    expect(alertPage.data[0]?.status).toBe("OPEN");
    expect(firstEvents.data).toHaveLength(2);
    expect(secondEvents.data[0]?.id).not.toBe(firstEvents.data[0]?.id);
  });

  it("persists lifecycle actor, timestamps, notes, Event and AuditLog atomically", async () => {
    const id = "50000000-0000-4000-8000-000000000002";
    await alerts.investigate(id, context(engineer));
    const resolved = await alerts.resolve(
      id,
      { resolutionNote: "Load returned to normal.", overrideReason: null },
      context(engineer),
    );
    expect(resolved.alert).toMatchObject({
      status: "RESOLVED",
      resolvedBy: { id: engineer.id },
      resolutionNote: "Load returned to normal.",
    });
    expect(
      await database.event.count({ where: { alertId: id } }),
    ).toBeGreaterThanOrEqual(2);
    expect(
      await database.auditLog.count({
        where: { entityId: id, entityType: "Alert" },
      }),
    ).toBe(2);
  });

  it("rolls back an invalid lifecycle command", async () => {
    const id = "50000000-0000-4000-8000-000000000001";
    const before = await database.event.count({ where: { alertId: id } });
    await expect(alerts.investigate(id, context(admin))).rejects.toMatchObject({
      code: "ALERT_INVALID_STATE",
    });
    expect(await database.event.count({ where: { alertId: id } })).toBe(before);
  });

  it("enforces one active Alert during concurrent metric evaluation", async () => {
    const now = new Date();
    const device = {
      id: "30000000-0000-4000-8000-000000000030",
      hostname: "NAS-BACKUP-01",
      status: "ONLINE" as const,
      archived: false,
      samples: [0, 1, 2].map((offset) => ({
        cpuPct: 10,
        ramPct: 20,
        diskPct: 30,
        pingMs: 130,
        packetLossPct: 0,
        status: "ONLINE" as const,
        sourceTime: new Date(now.getTime() + offset * 1_000),
        stale: false,
      })),
    };
    await Promise.all([
      alerts.evaluateAcceptedMetricBatch({
        batchKey: "concurrency-a",
        devices: [device],
      }),
      alerts.evaluateAcceptedMetricBatch({
        batchKey: "concurrency-b",
        devices: [device],
      }),
    ]);
    expect(
      await database.alert.count({
        where: {
          deviceId: device.id,
          alertRule: { code: "AR-PING-01" },
          status: { in: ["OPEN", "ACKNOWLEDGED", "INVESTIGATING"] },
        },
      }),
    ).toBe(1);
  });

  it("preserves Alert and Event history after soft archive", async () => {
    const deviceId = "30000000-0000-4000-8000-000000000002";
    await devices.archive(deviceId, true, context(admin));
    const alert = await alerts.getById("50000000-0000-4000-8000-000000000001", {
      actor: viewer,
    });
    const history = await events.list(
      {
        limit: 20,
        deviceId,
        types: [],
        severities: [],
        search: "",
      },
      { actor: viewer },
    );
    expect(alert.device.archived).toBe(true);
    expect(history.data.every((event) => event.device?.archived)).toBe(true);
    await expect(
      events.listForDevice(
        deviceId,
        { limit: 10, types: [], severities: [], search: "" },
        { actor: viewer },
      ),
    ).rejects.toMatchObject({ code: "DEVICE_NOT_FOUND" });
  });

  it("keeps deterministic Sprint 3 seed row counts idempotent", async () => {
    await resetTestDatabase();
    const first = await Promise.all([
      database.alertRule.count(),
      database.alert.count(),
      database.event.count(),
    ]);
    await resetTestDatabase();
    const second = await Promise.all([
      database.alertRule.count(),
      database.alert.count(),
      database.event.count(),
    ]);
    expect(first).toEqual([7, 4, 5]);
    expect(second).toEqual(first);
  }, 30_000);
});
