import { describe, expect, it, vi } from "vitest";

import { AlertRuleAdminService } from "@/modules/alerting/application/alert-rule-admin-service";

const rule = {
  id: "40000000-0000-4000-8000-000000000001",
  code: "AR-CPU-01",
  name: "CPU",
  metric: "CPU",
  operator: "GTE",
  warningThreshold: 80,
  criticalThreshold: 90,
  durationSeconds: 60,
  consecutiveSamples: null,
  enabled: true,
};
const actor = {
  actor: {
    id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
    name: "Administrator",
    email: "demo@example.invalid",
    role: "ADMIN" as const,
  },
  requestIp: null,
};

describe("AlertRule administration", () => {
  it("validates threshold ordering and metric ranges", async () => {
    const repository = {
      list: vi.fn().mockResolvedValue([rule]),
      update: vi.fn().mockResolvedValue(rule),
    };
    const service = new AlertRuleAdminService(repository);
    await expect(
      service.update(rule.id, { warningThreshold: 95 }, actor),
    ).rejects.toThrow("ordered incorrectly");
    await expect(
      service.update(rule.id, { criticalThreshold: 101 }, actor),
    ).rejects.toThrow("outside");
  });

  it("rejects enabling AR-BW-01", async () => {
    const repository = {
      list: vi
        .fn()
        .mockResolvedValue([
          { ...rule, code: "AR-BW-01", metric: "BANDWIDTH", enabled: false },
        ]),
      update: vi.fn(),
    };
    await expect(
      new AlertRuleAdminService(repository).update(
        rule.id,
        { enabled: true },
        actor,
      ),
    ).rejects.toThrow("cannot be enabled");
  });
});
