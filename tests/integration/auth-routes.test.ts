import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as logout } from "@/app/api/v1/auth/logout/route";
import { GET as me } from "@/app/api/v1/auth/me/route";
import { DEMO_ACCOUNTS } from "@/modules/identity/infrastructure/demo-accounts";
import { resetLoginRateLimitsForTests } from "@/modules/identity/infrastructure/login-rate-limit";
import { SESSION_COOKIE_NAME } from "@/modules/identity/infrastructure/session";

const TEST_SECRET =
  "route-test-secret-that-is-longer-than-thirty-two-characters";

function loginRequest(payload: unknown, client = "198.51.100.10"): NextRequest {
  return new NextRequest("http://localhost/api/v1/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": client,
    },
    body: JSON.stringify(payload),
  });
}

describe("Demo authentication routes", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = TEST_SECRET;
    resetLoginRateLimitsForTests();
  });

  afterEach(() => {
    delete process.env.AUTH_SECRET;
  });

  it.each(DEMO_ACCOUNTS)(
    "authenticates the deterministic $role account and returns an allow-listed identity",
    async (account) => {
      const response = await login(
        loginRequest(
          { email: account.email, password: account.password },
          account.role,
        ),
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get("set-cookie")).toContain(
        `${SESSION_COOKIE_NAME}=`,
      );
      expect(response.headers.get("set-cookie")).toContain("HttpOnly");
      expect(body).toMatchObject({
        data: {
          user: {
            email: account.email,
            role: account.role,
          },
        },
      });
      expect(JSON.stringify(body)).not.toContain(account.password);
      expect(JSON.stringify(body)).not.toContain("passwordHash");
    },
  );

  it("uses a generic response for invalid credentials", async () => {
    const response = await login(
      loginRequest({
        email: "unknown@securenet.demo",
        password: "incorrect-password",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("The email or password is incorrect.");
    expect(body.error.correlationId).toEqual(expect.any(String));
  });

  it("rejects an oversized request even without a content-length header", async () => {
    const response = await login(
      new NextRequest("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "198.51.100.20",
        },
        body: JSON.stringify({ padding: "x".repeat(5000) }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns the session from me and clears it on logout", async () => {
    const account = DEMO_ACCOUNTS[1];
    const loginResponse = await login(
      loginRequest(
        { email: account.email, password: account.password },
        "198.51.100.30",
      ),
    );
    const setCookie = loginResponse.headers.get("set-cookie");
    const cookie = setCookie?.split(";")[0];

    expect(cookie).toBeTruthy();

    const meResponse = await me(
      new NextRequest("http://localhost/api/v1/auth/me", {
        headers: { cookie: cookie ?? "" },
      }),
    );
    expect(meResponse.status).toBe(200);
    await expect(meResponse.json()).resolves.toMatchObject({
      data: { user: { role: "NETWORK_ENGINEER" } },
    });

    const logoutResponse = await logout(
      new NextRequest("http://localhost/api/v1/auth/logout", {
        method: "POST",
        headers: { cookie: cookie ?? "" },
      }),
    );
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers.get("set-cookie")).toContain(
      `${SESSION_COOKIE_NAME}=`,
    );
    expect(logoutResponse.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
