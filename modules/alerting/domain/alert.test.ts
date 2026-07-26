import { describe, expect, it } from "vitest";

import {
  AlertLifecycleError,
  evaluateAlertRule,
  nextAlertStatus,
  type AlertRuleDefinition,
  type MetricSample,
} from "@/modules/alerting/domain/alert";

const device = {
  id: "30000000-0000-4000-8000-000000000030",
  hostname: "NAS-BACKUP-01",
  status: "ONLINE" as const,
  archived: false,
};
const baseRule: AlertRuleDefinition = {
  id: "40000000-0000-4000-8000-000000000001",
  code: "TEST",
  metric: "CPU",
  operator: "GTE",
  warningThreshold: 80,
  criticalThreshold: 90,
  durationSeconds: 0,
  consecutiveSamples: null,
  enabled: true,
};
const sample = (
  value: number,
  seconds: number,
  overrides: Partial<MetricSample> = {},
): MetricSample => ({
  cpuPct: value,
  ramPct: null,
  diskPct: null,
  pingMs: null,
  packetLossPct: null,
  status: "ONLINE",
  sourceTime: new Date(Date.UTC(2026, 6, 26, 10, 0, seconds)),
  stale: false,
  ...overrides,
});

describe("Alert rule evaluation", () => {
  it.each([
    [79.99, null],
    [80, "WARNING"],
    [89.99, "WARNING"],
    [90, "CRITICAL"],
    [90.01, "CRITICAL"],
  ] as const)("classifies boundary %s as %s", (value, severity) => {
    expect(
      evaluateAlertRule(baseRule, device, [sample(value, 0)])?.severity ?? null,
    ).toBe(severity);
  });

  it("requires the full duration", () => {
    const rule = { ...baseRule, durationSeconds: 60 };
    expect(
      evaluateAlertRule(rule, device, [sample(95, 0), sample(95, 59)]),
    ).toBeNull();
    expect(
      evaluateAlertRule(rule, device, [
        sample(95, 0),
        sample(95, 30),
        sample(95, 60),
      ])?.severity,
    ).toBe("CRITICAL");
  });

  it("requires consecutive matching samples", () => {
    const rule = { ...baseRule, durationSeconds: 0, consecutiveSamples: 3 };
    expect(
      evaluateAlertRule(rule, device, [sample(85, 0), sample(85, 10)]),
    ).toBeNull();
    expect(
      evaluateAlertRule(rule, device, [
        sample(85, 0),
        sample(85, 10),
        sample(85, 20),
      ])?.severity,
    ).toBe("WARNING");
  });

  it("excludes stale, maintenance, archived, disabled, and bandwidth inputs", () => {
    expect(
      evaluateAlertRule(baseRule, device, [sample(95, 0, { stale: true })]),
    ).toBeNull();
    expect(
      evaluateAlertRule(baseRule, { ...device, status: "MAINTENANCE" }, [
        sample(95, 0),
      ]),
    ).toBeNull();
    expect(
      evaluateAlertRule(baseRule, { ...device, archived: true }, [
        sample(95, 0),
      ]),
    ).toBeNull();
    expect(
      evaluateAlertRule({ ...baseRule, enabled: false }, device, [
        sample(95, 0),
      ]),
    ).toBeNull();
    expect(
      evaluateAlertRule({ ...baseRule, metric: "BANDWIDTH" }, device, [
        sample(95, 0),
      ]),
    ).toBeNull();
  });
});

describe("Alert lifecycle", () => {
  it("supports the canonical progression", () => {
    expect(
      nextAlertStatus({
        current: "OPEN",
        command: "ACKNOWLEDGE",
        role: "NETWORK_ENGINEER",
        conditionActive: true,
      }),
    ).toBe("ACKNOWLEDGED");
    expect(
      nextAlertStatus({
        current: "ACKNOWLEDGED",
        command: "INVESTIGATE",
        role: "NETWORK_ENGINEER",
        conditionActive: true,
      }),
    ).toBe("INVESTIGATING");
    expect(
      nextAlertStatus({
        current: "INVESTIGATING",
        command: "RESOLVE",
        role: "NETWORK_ENGINEER",
        conditionActive: false,
      }),
    ).toBe("RESOLVED");
  });

  it.each([
    {
      current: "OPEN",
      command: "INVESTIGATE",
      role: "ADMIN",
      conditionActive: false,
      code: "ALERT_INVALID_STATE",
    },
    {
      current: "OPEN",
      command: "RESOLVE",
      role: "ADMIN",
      conditionActive: false,
      code: "ALERT_OVERRIDE_REASON_REQUIRED",
    },
    {
      current: "ACKNOWLEDGED",
      command: "RESOLVE",
      role: "NETWORK_ENGINEER",
      conditionActive: true,
      code: "ALERT_CONDITION_NOT_CLEARED",
    },
  ] as const)("rejects invalid transition with $code", (input) => {
    expect(() => nextAlertStatus(input)).toThrow(
      expect.objectContaining({ code: input.code }) as AlertLifecycleError,
    );
  });
});
