import { compare } from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEMO_ACCOUNTS } from "@/modules/identity/infrastructure/demo-accounts";
import { DemoUserRepository } from "@/modules/identity/infrastructure/demo-user-repository";

const DOCUMENTED_DEMO_PASSWORD = "SecureNetDemo123";

describe("DemoUserRepository password configuration", () => {
  beforeEach(() => {
    process.env.SEED_DEMO_PASSWORD = DOCUMENTED_DEMO_PASSWORD;
  });

  afterEach(() => {
    delete process.env.SEED_DEMO_PASSWORD;
  });

  it.each(DEMO_ACCOUNTS)(
    "generates a matching cost-12 hash for $role",
    async (account) => {
      const user = await new DemoUserRepository().findByEmail(account.email);

      expect(user).not.toBeNull();
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$12\$/);
      await expect(
        compare(DOCUMENTED_DEMO_PASSWORD, user?.passwordHash ?? ""),
      ).resolves.toBe(true);
      await expect(
        compare("incorrect-demo-password", user?.passwordHash ?? ""),
      ).resolves.toBe(false);
    },
  );
});
