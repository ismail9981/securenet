import { afterEach, describe, expect, it, vi } from "vitest";

import { logEvent, sanitizeLogValue } from "@/lib/logger";

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.LOG_LEVEL;
});

describe("structured logger", () => {
  it("redacts credential and connection values recursively", () => {
    expect(
      sanitizeLogValue({
        password: "public-no",
        nested: {
          authorization: "Bearer no",
          databaseUrl: "postgresql://user:secret@host/database",
        },
      }),
    ).toEqual({
      password: "[REDACTED]",
      nested: {
        authorization: "[REDACTED]",
        databaseUrl: "[REDACTED]",
      },
    });
    expect(sanitizeLogValue("postgresql://user:secret@host/database")).toBe(
      "[REDACTED]",
    );
  });

  it("honors LOG_LEVEL without exposing context", () => {
    process.env.LOG_LEVEL = "warn";
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    logEvent("info", "suppressed", { password: "no" });
    logEvent("warn", "visible", { password: "no" });
    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[REDACTED]"));
  });
});
