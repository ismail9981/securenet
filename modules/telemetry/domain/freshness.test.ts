import { describe, expect, it } from "vitest";

import {
  DEFAULT_STALE_AFTER_SECONDS,
  isMetricStale,
} from "@/modules/telemetry/domain/freshness";

describe("metric freshness", () => {
  const now = new Date("2026-07-26T08:02:00.000Z");

  it("keeps the documented boundary fresh", () => {
    expect(
      isMetricStale(
        new Date(now.getTime() - DEFAULT_STALE_AFTER_SECONDS * 1000),
        now,
      ),
    ).toBe(false);
  });

  it("marks a metric stale immediately beyond the boundary", () => {
    expect(
      isMetricStale(
        new Date(now.getTime() - DEFAULT_STALE_AFTER_SECONDS * 1000 - 1),
        now,
      ),
    ).toBe(true);
  });
});
