import { describe, expect, it } from "vitest";

import { updateSystemSettingSchema } from "@/modules/settings/domain/settings";

describe("global settings contract", () => {
  it("accepts only the four approved settings", () => {
    expect(
      updateSystemSettingSchema.parse({
        timezone: "Asia/Muscat",
        cpuUnit: "percent",
        memoryUnit: "percent",
        trafficUnit: "Mbps",
      }),
    ).toMatchObject({ timezone: "Asia/Muscat" });
    expect(() =>
      updateSystemSettingSchema.parse({
        timezone: "Europe/London",
        cpuUnit: "percent",
        memoryUnit: "percent",
        trafficUnit: "Mbps",
      }),
    ).toThrow();
    expect(() =>
      updateSystemSettingSchema.parse({
        timezone: "UTC",
        cpuUnit: "percent",
        memoryUnit: "percent",
        trafficUnit: "Mbps",
        retentionDays: 30,
      }),
    ).toThrow();
  });
});
