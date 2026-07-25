import { beforeEach, describe, expect, it } from "vitest";

import {
  checkLoginRateLimit,
  resetLoginRateLimitsForTests,
} from "@/modules/identity/infrastructure/login-rate-limit";

describe("Demo login rate limit", () => {
  beforeEach(resetLoginRateLimitsForTests);

  it("blocks the sixth attempt in a window", () => {
    for (let index = 0; index < 5; index += 1) {
      expect(checkLoginRateLimit("client", 1000)).toEqual({ allowed: true });
    }

    expect(checkLoginRateLimit("client", 1000)).toEqual({
      allowed: false,
      retryAfterSeconds: 900,
    });
  });
});
