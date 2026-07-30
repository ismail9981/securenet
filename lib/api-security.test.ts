import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import { assertSameOrigin, handleApiError } from "@/lib/api";
import { resetMutationRateLimits } from "@/modules/identity/infrastructure/mutation-rate-limit";

afterEach(resetMutationRateLimits);

describe("API security boundary", () => {
  it("rejects cross-origin mutations behind the forwarded production host", () => {
    expect(() =>
      assertSameOrigin(
        new NextRequest("https://securenet.onrender.com/api/v1/settings", {
          method: "PUT",
          headers: {
            host: "securenet.onrender.com",
            origin: "https://attacker.example",
          },
        }),
        "MANAGE_SETTINGS",
      ),
    ).toThrow();
  });

  it("returns 429 after the process-local administrative mutation budget", async () => {
    const request = new NextRequest(
      "https://securenet.onrender.com/api/v1/settings",
      {
        method: "PUT",
        headers: {
          host: "securenet.onrender.com",
          origin: "https://securenet.onrender.com",
          "x-forwarded-for": "198.51.100.90",
        },
      },
    );
    for (let index = 0; index < 60; index += 1) {
      expect(() => assertSameOrigin(request, "MANAGE_SETTINGS")).not.toThrow();
    }

    let response: Response | undefined;
    try {
      assertSameOrigin(request, "MANAGE_SETTINGS");
    } catch (error) {
      response = handleApiError(error);
    }
    expect(response?.status).toBe(429);
    expect(response?.headers.get("retry-after")).toBe("60");
  });
});
