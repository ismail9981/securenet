import { describe, expect, it } from "vitest";

import nextConfig from "@/next.config";

describe("security headers", () => {
  it("sets the approved CSP and browser hardening without unvalidated HSTS", async () => {
    const entries = await nextConfig.headers?.();
    const headers = entries?.[0]?.headers ?? [];
    const values = Object.fromEntries(
      headers.map(({ key, value }) => [key, value]),
    );
    expect(values["Content-Security-Policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(values["X-Content-Type-Options"]).toBe("nosniff");
    expect(values["X-Frame-Options"]).toBe("DENY");
    expect(values["Strict-Transport-Security"]).toBeUndefined();
  });
});
