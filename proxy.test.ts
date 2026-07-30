import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "@/proxy";
import { SESSION_COOKIE_NAME } from "@/modules/identity/infrastructure/session-constants";

describe("optimistic proxy checks", () => {
  it.each(["/reports", "/settings", "/devices"])(
    "redirects an unauthenticated protected route: %s",
    (path) => {
      const response = proxy(new NextRequest(`http://localhost${path}`));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/login");
    },
  );

  it("preserves a safe correlation ID for API requests", () => {
    const response = proxy(
      new NextRequest("http://localhost/api/v1/devices", {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=placeholder`,
          "x-correlation-id": "request-123",
        },
      }),
    );
    expect(response.headers.get("x-correlation-id")).toBe("request-123");
  });
});
