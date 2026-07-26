import { afterEach, describe, expect, it } from "vitest";

import { requireTestDatabaseUrl } from "@/lib/database-url";

describe("test database guard", () => {
  afterEach(() => {
    delete process.env.TEST_DATABASE_URL;
  });

  it("accepts only the exact securenet_test database name", () => {
    process.env.TEST_DATABASE_URL =
      "postgresql://securenet:hidden@127.0.0.1:5432/securenet_test?schema=public";

    expect(requireTestDatabaseUrl()).toContain("/securenet_test");
  });

  it.each(["securenet_dev", "securenet_test_backup", "postgres"])(
    "refuses destructive operations against %s",
    (databaseName) => {
      process.env.TEST_DATABASE_URL = `postgresql://securenet:hidden@127.0.0.1:5432/${databaseName}`;

      expect(() => requireTestDatabaseUrl()).toThrow(
        "Refusing destructive test operation",
      );
    },
  );
});
