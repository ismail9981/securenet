import { describe, expect, it } from "vitest";

import {
  alertStatusSchema,
  deviceStatusSchema,
  deviceTypeSchema,
  userRoleSchema,
} from "./network";

describe("approved core network enums", () => {
  it("accepts documented device types and statuses", () => {
    expect(deviceTypeSchema.parse("FIREWALL")).toBe("FIREWALL");
    expect(deviceStatusSchema.parse("MAINTENANCE")).toBe("MAINTENANCE");
  });

  it("preserves the DOC-001 alert lifecycle", () => {
    expect(alertStatusSchema.parse("INVESTIGATING")).toBe("INVESTIGATING");
  });

  it("rejects undocumented roles", () => {
    expect(() => userRoleSchema.parse("OWNER")).toThrow();
  });
});
