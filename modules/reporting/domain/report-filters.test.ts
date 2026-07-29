import { describe, expect, it } from "vitest";

import { parseReportFilters } from "@/modules/reporting/domain/report-filters";

describe("shared report filters", () => {
  it("normalizes the approved values", () => {
    const query = parseReportFilters(
      new URLSearchParams({
        from: "2026-07-28T00:00:00.000Z",
        to: "2026-07-29T00:00:00.000Z",
        severity: "CRITICAL",
        alertStatus: "OPEN",
        deviceStatus: "OFFLINE",
      }),
    );
    expect(query.severity).toBe("CRITICAL");
    expect(query.alertStatus).toBe("OPEN");
    expect(query.deviceStatus).toBe("OFFLINE");
  });

  it("rejects reversed, overlong, and malformed periods", () => {
    expect(() =>
      parseReportFilters(
        new URLSearchParams({
          from: "2026-07-29T00:00:00.000Z",
          to: "2026-07-28T00:00:00.000Z",
        }),
      ),
    ).toThrow();
    expect(() =>
      parseReportFilters(
        new URLSearchParams({
          from: "2026-06-01T00:00:00.000Z",
          to: "2026-07-29T00:00:00.000Z",
        }),
      ),
    ).toThrow();
    expect(() =>
      parseReportFilters(new URLSearchParams({ severity: "SEVERE" })),
    ).toThrow();
  });
});
