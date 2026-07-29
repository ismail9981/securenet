import { performance } from "node:perf_hooks";

import { config } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { requireTestDatabaseUrl } from "@/lib/database-url";
import type { DeviceService } from "@/modules/inventory/application/device-service";
import type { ReportService } from "@/modules/reporting/application/report-service";
import { reportFilterSchema } from "@/modules/reporting/domain/report-filters";
import type { TopologyService } from "@/modules/topology/application/topology-service";
import { resetTestDatabase } from "@/scripts/reset-test-database";

config({ path: ".env.local", quiet: true });
process.env.DATABASE_URL = requireTestDatabaseUrl();

const admin = {
  id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
  name: "Administrator",
  email: "admin@securenet.demo",
  role: "ADMIN" as const,
};
const context = { actor: admin, requestIp: null };
const deviceId = "30000000-0000-4000-8000-000000000001";
const filters = reportFilterSchema.parse({
  from: new Date(Date.now() - 29 * 24 * 60 * 60 * 1_000).toISOString(),
  to: new Date(Date.now() + 60_000).toISOString(),
});

let database: PrismaClient;
let reports: ReportService;
let devices: DeviceService;
let topology: TopologyService;
const evidence: Record<string, number> = {};

describe("Sprint 6 local engineering budgets", () => {
  beforeAll(async () => {
    await resetTestDatabase();
    ({ prisma: database } = await import("@/lib/prisma"));
    ({ reportService: reports } =
      await import("@/modules/reporting/infrastructure/report-service"));
    ({ deviceService: devices } =
      await import("@/modules/inventory/infrastructure/device-service"));
    ({ topologyService: topology } =
      await import("@/modules/topology/infrastructure/topology-service"));
  }, 120_000);

  afterAll(async () => {
    console.info("Sprint 6 local performance evidence", evidence);
    await database?.$disconnect();
  });

  it("loads reports within 3 seconds and filtered queries within 750 ms P95", async () => {
    const initialStart = performance.now();
    await reports.networkHealth(filters, { actor: admin });
    evidence.reportInitialMs = Math.round(performance.now() - initialStart);
    expect(evidence.reportInitialMs).toBeLessThanOrEqual(3_000);

    const samples: number[] = [];
    for (let index = 0; index < 20; index += 1) {
      const start = performance.now();
      await reports.networkHealth(
        { ...filters, severity: index % 2 ? "CRITICAL" : "WARNING" },
        { actor: admin },
      );
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    evidence.filterP95Ms = Math.round(
      samples[Math.ceil(samples.length * 0.95) - 1] ?? 0,
    );
    expect(evidence.filterP95Ms).toBeLessThanOrEqual(750);
  });

  it("exports 10,000 rows within 5 seconds", async () => {
    const now = new Date();
    await database.alert.createMany({
      data: Array.from({ length: 10_000 }, (_, index) => ({
        id: `70000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        deviceId,
        alertRuleId: null,
        dedupeKey: `performance:${index}`,
        title: `Performance Alert ${index}`,
        description: index === 0 ? "=FORMULA()" : `Message ${index}`,
        severity: "INFO",
        status: "RESOLVED",
        source: "METRIC_RULE",
        openedAt: now,
        resolvedAt: now,
        resolvedById: admin.id,
        lastTriggeredAt: now,
      })),
    });
    const start = performance.now();
    const result = await reports.alertsCsv(filters, context);
    evidence.csv10000Ms = Math.round(performance.now() - start);
    expect(evidence.csv10000Ms).toBeLessThanOrEqual(5_000);
    expect(result.rowCount).toBe(10_000);
    expect(result.content).toContain("'=FORMULA()");
  }, 30_000);

  it("queries historical Metrics and saves 30 positions within one second", async () => {
    const historyStart = performance.now();
    const history = await devices.getMetrics(
      deviceId,
      { range: "30d", limit: 24 },
      { actor: admin },
    );
    evidence.history30dMs = Math.round(performance.now() - historyStart);
    expect(evidence.history30dMs).toBeLessThanOrEqual(1_000);
    expect(history.data.length).toBeLessThanOrEqual(500);

    const active = await database.device.findMany({
      where: { archivedAt: null },
      select: { id: true },
      orderBy: { id: "asc" },
      take: 30,
    });
    const topologyStart = performance.now();
    await topology.savePositions(
      {
        positions: active.map((device, index) => ({
          deviceId: device.id,
          x: index * 10,
          y: index * -10,
        })),
      },
      context,
    );
    evidence.topology30SaveMs = Math.round(performance.now() - topologyStart);
    expect(evidence.topology30SaveMs).toBeLessThanOrEqual(1_000);
  });
});
