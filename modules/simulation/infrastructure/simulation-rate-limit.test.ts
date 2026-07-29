import { beforeEach, describe, expect, it } from "vitest";

import {
  acceptSimulationCommand,
  resetSimulationRateLimitForTests,
} from "@/modules/simulation/infrastructure/simulation-rate-limit";

describe("simulation command rate limit", () => {
  beforeEach(resetSimulationRateLimitForTests);

  it("bounds commands per user and resets after the Demo window", () => {
    for (let index = 0; index < 12; index += 1) {
      expect(acceptSimulationCommand("admin", 1_000)).toBe(true);
    }
    expect(acceptSimulationCommand("admin", 1_000)).toBe(false);
    expect(acceptSimulationCommand("admin", 61_001)).toBe(true);
    expect(acceptSimulationCommand("another-admin", 1_000)).toBe(true);
  });
});
