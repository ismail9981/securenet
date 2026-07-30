import { afterEach, describe, expect, it } from "vitest";

import {
  checkMutationRateLimit,
  resetMutationRateLimits,
} from "@/modules/identity/infrastructure/mutation-rate-limit";

afterEach(resetMutationRateLimits);

describe("administrative mutation rate limiter", () => {
  it("limits repeated mutations within one process and resets by window", () => {
    for (let index = 0; index < 60; index += 1) {
      expect(checkMutationRateLimit("actor", 1000).allowed).toBe(true);
    }
    expect(checkMutationRateLimit("actor", 1000)).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
    expect(checkMutationRateLimit("actor", 61_001).allowed).toBe(true);
  });
});
