import { describe, expect, it, vi } from "vitest";

import { checkReadiness } from "@/lib/health";

const environment = {
  AUTH_SECRET: "a".repeat(32),
  DATABASE_URL: "postgresql://user:password@localhost/securenet_dev",
  NODE_ENV: "development",
  SECURENET_DEPLOYMENT_ENV: "local",
};

describe("health contract", () => {
  it("reports ready only after environment and database checks pass", async () => {
    expect(
      await checkReadiness({
        environment,
        checkDatabase: vi.fn().mockResolvedValue(undefined),
      }),
    ).toBe(true);
  });

  it("reports unavailable for invalid configuration without querying data", async () => {
    const checkDatabase = vi.fn();
    expect(await checkReadiness({ environment: {}, checkDatabase })).toBe(
      false,
    );
    expect(checkDatabase).not.toHaveBeenCalled();
  });

  it("reports unavailable for database failure", async () => {
    expect(
      await checkReadiness({
        environment,
        checkDatabase: vi.fn().mockRejectedValue(new Error("connection")),
      }),
    ).toBe(false);
  });
});
