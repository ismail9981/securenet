import { describe, expect, it } from "vitest";

import { assertEmptyPortfolioDatabase } from "@/scripts/portfolio-bootstrap";

describe("Portfolio Demo bootstrap guard", () => {
  it("accepts an empty application database", () => {
    expect(() =>
      assertEmptyPortfolioDatabase({
        users: 0,
        devices: 0,
        events: 0,
        auditLogs: 0,
      }),
    ).not.toThrow();
  });

  it("refuses a populated database without changing the observed counts", () => {
    const counts = { users: 1, devices: 0, events: 0, auditLogs: 0 };
    expect(() => assertEmptyPortfolioDatabase(counts)).toThrow(
      /application data already exists/,
    );
    expect(counts).toEqual({ users: 1, devices: 0, events: 0, auditLogs: 0 });
  });
});
