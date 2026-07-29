import { config } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { requireTestDatabaseUrl } from "@/lib/database-url";
import type { AlertRuleAdminService } from "@/modules/alerting/application/alert-rule-admin-service";
import type { DeviceService } from "@/modules/inventory/application/device-service";
import type { ReportService } from "@/modules/reporting/application/report-service";
import { reportFilterSchema } from "@/modules/reporting/domain/report-filters";
import type { SettingsService } from "@/modules/settings/application/settings-service";
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
const viewer = {
  id: "a8785311-78fa-4d3e-8f15-0511adb68597",
  name: "Viewer",
  email: "viewer@securenet.demo",
  role: "VIEWER" as const,
};
const mutation = { actor: admin, requestIp: "198.51.100.60" };

let database: PrismaClient;
let reports: ReportService;
let settings: SettingsService;
let rules: AlertRuleAdminService;
let topology: TopologyService;
let devices: DeviceService;

describe("Sprint 6 repositories", () => {
  beforeAll(async () => {
    await resetTestDatabase();
    ({ prisma: database } = await import("@/lib/prisma"));
    ({ reportService: reports } =
      await import("@/modules/reporting/infrastructure/report-service"));
    ({ settingsService: settings } =
      await import("@/modules/settings/infrastructure/settings-service"));
    ({ alertRuleAdminService: rules } =
      await import("@/modules/alerting/infrastructure/alert-rule-admin-service"));
    ({ topologyService: topology } =
      await import("@/modules/topology/infrastructure/topology-service"));
    ({ deviceService: devices } =
      await import("@/modules/inventory/infrastructure/device-service"));
  });

  afterAll(async () => database.$disconnect());

  it("seeds the global defaults idempotently", async () => {
    await resetTestDatabase();
    const first = await settings.get({ actor: viewer });
    await resetTestDatabase();
    const second = await settings.get({ actor: viewer });
    expect(first).toMatchObject({
      timezone: "Asia/Muscat",
      cpuUnit: "percent",
      memoryUnit: "percent",
      trafficUnit: "Mbps",
    });
    expect(second).toMatchObject({
      timezone: "Asia/Muscat",
      trafficUnit: "Mbps",
    });
  });

  it("updates settings transactionally and records the approved audit action", async () => {
    const updated = await settings.update(
      {
        timezone: "UTC",
        cpuUnit: "percent",
        memoryUnit: "percent",
        trafficUnit: "Gbps",
      },
      mutation,
    );
    expect(updated).toMatchObject({ timezone: "UTC", trafficUnit: "Gbps" });
    expect(
      await database.auditLog.count({ where: { action: "settings.updated" } }),
    ).toBe(1);
  });

  it("aggregates the Network Health Report over the validated period", async () => {
    const filters = reportFilterSchema.parse({
      from: new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString(),
      to: new Date().toISOString(),
    });
    const report = await reports.networkHealth(filters, { actor: viewer });
    expect(report.deviceCounts.totalActive).toBe(30);
    expect(report.metrics.totalDownload).toBeGreaterThan(0);
    expect(report.topProblemDevices.length).toBeLessThanOrEqual(10);
    expect(report.health.formulaComplete).toBe(false);
  });

  it("exports the exact bounded secure CSV contract and audits without Events", async () => {
    const eventCount = await database.event.count();
    await database.alert.update({
      where: { id: "50000000-0000-4000-8000-000000000001" },
      data: { description: '=HYPERLINK("https://example.invalid")' },
    });
    const filters = reportFilterSchema.parse({
      from: new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString(),
      to: new Date().toISOString(),
    });
    const result = await reports.alertsCsv(filters, mutation);
    expect(result.content.startsWith("\uFEFF")).toBe(true);
    expect(result.content).toContain(
      '"Alert ID","Device Name","Device Hostname","Rule Code","Severity","Status","Message","Opened At","Acknowledged At","Resolved At","Assignee","Source"\r\n',
    );
    expect(result.content.replaceAll("\r\n", "")).not.toContain("\n");
    expect(result.content).toContain(
      `"'=HYPERLINK(""https://example.invalid"")"`,
    );
    expect(result.rowCount).toBeLessThanOrEqual(10_000);
    expect(result.filename).toMatch(
      /^securenet-alerts-\d{4}-\d{2}-\d{2}-\d{4}\.csv$/,
    );
    expect(await database.event.count()).toBe(eventCount);
    expect(
      await database.auditLog.count({
        where: { action: "report.alerts.exported" },
      }),
    ).toBe(1);
  });

  it("updates only approved AlertRule fields and preserves Alerts", async () => {
    const beforeAlerts = await database.alert.count();
    const cpu = (await rules.list({ actor: admin })).find(
      (rule) => rule.code === "AR-CPU-01",
    )!;
    const updated = await rules.update(
      cpu.id,
      { warningThreshold: 80, durationSeconds: 120, enabled: true },
      mutation,
    );
    expect(updated).toMatchObject({
      code: "AR-CPU-01",
      warningThreshold: 80,
      durationSeconds: 120,
    });
    expect(await database.alert.count()).toBe(beforeAlerts);
    expect(
      await database.auditLog.count({
        where: { action: "alert_rule.updated" },
      }),
    ).toBe(1);
  });

  it("saves partial Topology positions and leaves deterministic fallback nodes", async () => {
    const deviceId = "30000000-0000-4000-8000-000000000001";
    await expect(
      topology.savePositions(
        { positions: [{ deviceId, x: 125, y: -45 }] },
        { actor: viewer, requestIp: null },
      ),
    ).rejects.toThrow();
    await topology.savePositions(
      { positions: [{ deviceId, x: 125, y: -45 }] },
      mutation,
    );
    const snapshot = await topology.getActiveSnapshot({ actor: viewer });
    expect(snapshot.positions).toEqual([{ deviceId, x: 125, y: -45 }]);
    expect(snapshot.nodes).toHaveLength(30);
    expect(snapshot.links).toHaveLength(29);
    expect(
      await database.auditLog.count({
        where: { action: "topology.positions.saved" },
      }),
    ).toBe(1);
  });

  it.each(["1h", "6h", "24h", "7d", "30d"] as const)(
    "returns at most 500 points for %s history",
    async (range) => {
      const result = await devices.getMetrics(
        "30000000-0000-4000-8000-000000000001",
        { range, limit: 24 },
        { actor: viewer },
      );
      expect(result.data.length).toBeLessThanOrEqual(500);
      expect(result.meta.range).toBe(range);
      if (range !== "1h") expect(result.meta.aggregated).toBe(true);
    },
  );
});
