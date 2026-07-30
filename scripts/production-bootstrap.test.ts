import { describe, expect, it } from "vitest";

import { assertEmptyProductionDatabase } from "@/scripts/production-bootstrap";

describe("production Demo bootstrap guard", () => {
  it("accepts only an entirely empty operational database", () => {
    expect(() =>
      assertEmptyProductionDatabase({ devices: 0, events: 0, auditLogs: 0 }),
    ).not.toThrow();
  });

  it("refuses existing operational history without modifying it", () => {
    const counts = { devices: 0, events: 1, auditLogs: 2 };
    expect(() => assertEmptyProductionDatabase(counts)).toThrow(
      /operational data exists/,
    );
    expect(counts).toEqual({ devices: 0, events: 1, auditLogs: 2 });
  });
});
