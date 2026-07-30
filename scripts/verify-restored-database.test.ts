import { describe, expect, it } from "vitest";

import { validateIsolatedRestoreTarget } from "@/scripts/verify-restored-database";

describe("isolated restore verification guard", () => {
  it("accepts a positively identified isolated target", () => {
    expect(
      validateIsolatedRestoreTarget(
        "postgresql://user:password@host/securenet_restore_check",
        "securenet_restore_check",
        "postgresql://user:password@host/securenet_prod_demo",
      ),
    ).toBe("securenet_restore_check");
  });

  it.each(["securenet_dev", "securenet_test", "postgres"])(
    "refuses protected target %s",
    (name) => {
      expect(() =>
        validateIsolatedRestoreTarget(
          `postgresql://user:password@host/${name}`,
          name,
          undefined,
        ),
      ).toThrow();
    },
  );

  it("refuses the live connection", () => {
    const url = "postgresql://user:password@host/securenet_prod_demo";
    expect(() =>
      validateIsolatedRestoreTarget(url, "securenet_prod_demo", url),
    ).toThrow();
  });
});
