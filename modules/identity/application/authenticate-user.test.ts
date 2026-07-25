import { describe, expect, it } from "vitest";

import { authenticateUser } from "@/modules/identity/application/authenticate-user";
import type { PasswordVerifier } from "@/modules/identity/application/password-verifier";
import type {
  UserRepository,
  UserWithPasswordHash,
} from "@/modules/identity/application/user-repository";

const activeUser: UserWithPasswordHash = {
  id: "6f3a8aa8-f6a1-4c24-9252-e49706dc973b",
  name: "Nasser Al-Balushi",
  email: "engineer@securenet.demo",
  passwordHash: "expected-hash",
  role: "NETWORK_ENGINEER",
  status: "ACTIVE",
};

function dependencies(
  user: UserWithPasswordHash | null,
  passwordMatches: boolean,
) {
  const users: UserRepository = {
    findByEmail: async () => user,
  };
  const passwords: PasswordVerifier = {
    verify: async () => passwordMatches,
  };
  return { users, passwords };
}

describe("authenticateUser", () => {
  it("normalizes the email and returns only public user fields", async () => {
    let requestedEmail = "";
    const users: UserRepository = {
      findByEmail: async (email) => {
        requestedEmail = email;
        return activeUser;
      },
    };

    const result = await authenticateUser(
      { email: " ENGINEER@SecureNet.Demo ", password: "valid" },
      { users, passwords: dependencies(activeUser, true).passwords },
    );

    expect(requestedEmail).toBe("engineer@securenet.demo");
    expect(result).toEqual({
      ok: true,
      user: {
        id: activeUser.id,
        name: activeUser.name,
        email: activeUser.email,
        role: activeUser.role,
      },
    });
  });

  it("uses the same generic result for missing and invalid credentials", async () => {
    const missing = await authenticateUser(
      { email: "missing@securenet.demo", password: "invalid" },
      dependencies(null, false),
    );
    const invalid = await authenticateUser(
      { email: activeUser.email, password: "invalid" },
      dependencies(activeUser, false),
    );

    expect(missing).toEqual({ ok: false, code: "AUTH_INVALID_CREDENTIALS" });
    expect(invalid).toEqual(missing);
  });

  it("rejects disabled accounts", async () => {
    const result = await authenticateUser(
      { email: activeUser.email, password: "valid" },
      dependencies({ ...activeUser, status: "DISABLED" }, true),
    );

    expect(result).toEqual({ ok: false, code: "AUTH_INVALID_CREDENTIALS" });
  });
});
