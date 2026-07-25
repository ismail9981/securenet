import { describe, expect, it } from "vitest";

import {
  calculateDocumentedHealthScore,
  classifyHealthScore,
} from "@/modules/monitoring/domain/health-score";

describe("documented Network Health Score subset", () => {
  it("applies exact deductions and documented caps", () => {
    const result = calculateDocumentedHealthScore({
      offlineCriticalDevices: 99,
      openCriticalAlerts: 99,
      openWarningAlerts: 99,
    });

    expect(result.deductions).toEqual({
      offlineDevices: 25,
      criticalAlerts: 24,
      warningAlerts: 10,
      total: 59,
    });
    expect(result.score).toBe(41);
  });

  it.each([
    [100, "EXCELLENT"],
    [98, "EXCELLENT"],
    [97, "HEALTHY"],
    [90, "HEALTHY"],
    [89, "WARNING"],
    [75, "WARNING"],
    [74, "CRITICAL"],
    [0, "CRITICAL"],
  ] as const)("classifies %i as %s", (score, label) => {
    expect(classifyHealthScore(score)).toBe(label);
  });

  it("states that interpolation-dependent factors remain unresolved", () => {
    const result = calculateDocumentedHealthScore({
      offlineCriticalDevices: 0,
      openCriticalAlerts: 0,
      openWarningAlerts: 0,
    });

    expect(result.formulaComplete).toBe(false);
    expect(result.unresolvedFactors).toEqual([
      "AVERAGE_PACKET_LOSS",
      "AVERAGE_PING",
      "DEGRADED_DEVICE_RATIO",
    ]);
  });
});
