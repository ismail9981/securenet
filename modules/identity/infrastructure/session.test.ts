import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSessionToken,
  getSessionCookieOptions,
  verifySessionToken,
} from "@/modules/identity/infrastructure/session";

const TEST_SECRET =
  "test-only-secret-that-is-longer-than-thirty-two-characters";

describe("signed Demo session", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.AUTH_SECRET;
    vi.unstubAllEnvs();
  });

  it("round-trips allow-listed user data", async () => {
    const token = await createSessionToken({
      id: "6f3a8aa8-f6a1-4c24-9252-e49706dc973b",
      name: "Nasser Al-Balushi",
      email: "engineer@securenet.demo",
      role: "NETWORK_ENGINEER",
    });

    const session = await verifySessionToken(token);
    expect(session?.user.role).toBe("NETWORK_ENGINEER");
    expect(session?.user).not.toHaveProperty("passwordHash");
  });

  it("rejects a modified token", async () => {
    const token = await createSessionToken({
      id: "a8785311-78fa-4d3e-8f15-0511adb68597",
      name: "Maha Al-Rashdi",
      email: "viewer@securenet.demo",
      role: "VIEWER",
    });
    const [header, payload, signature] = token.split(".");
    const modifiedPayload = `${payload?.startsWith("a") ? "b" : "a"}${payload?.slice(1)}`;
    const modified = `${header}.${modifiedPayload}.${signature}`;

    await expect(verifySessionToken(modified)).resolves.toBeNull();
  });

  it("uses HttpOnly, SameSite=Lax, and Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getSessionCookieOptions()).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  });

  it("allows local HTTP only for the explicit test deployment mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SECURENET_DEPLOYMENT_ENV", "test");
    expect(getSessionCookieOptions().secure).toBe(false);
  });
});
