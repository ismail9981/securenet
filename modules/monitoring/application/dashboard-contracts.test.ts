import { describe, expect, it } from "vitest";

import { getDashboardSnapshot } from "@/modules/monitoring/application/get-dashboard-snapshot";
import { DemoDashboardRepository } from "@/modules/monitoring/infrastructure/demo-dashboard-repository";

describe("Dashboard snapshot contract", () => {
  it("returns deterministic, explicitly simulated fixture data", async () => {
    const snapshot = await getDashboardSnapshot(
      new DemoDashboardRepository(),
      "VIEWER",
    );

    expect(snapshot.source).toBe("SIMULATION_FIXTURE");
    expect(snapshot.summary.totalDevices).toBe(30);
    expect(snapshot.traffic).toHaveLength(12);
    expect(snapshot.networkHealth.formulaComplete).toBe(false);
  });
});
