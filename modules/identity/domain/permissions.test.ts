import { describe, expect, it } from "vitest";

import {
  AuthorizationError,
  assertPermission,
  hasPermission,
} from "@/modules/identity/domain/permissions";

describe("RBAC permission matrix", () => {
  it("allows administrators to perform every approved operation", () => {
    expect(hasPermission("ADMIN", "MANAGE_USERS")).toBe(true);
    expect(hasPermission("ADMIN", "RUN_SIMULATION")).toBe(true);
  });

  it("allows network engineers to acknowledge alerts but not manage devices", () => {
    expect(hasPermission("NETWORK_ENGINEER", "ACKNOWLEDGE_ALERTS")).toBe(true);
    expect(hasPermission("NETWORK_ENGINEER", "MANAGE_DEVICES")).toBe(false);
  });

  it("keeps viewers read-only", () => {
    expect(hasPermission("VIEWER", "VIEW_DASHBOARD")).toBe(true);
    expect(() => assertPermission("VIEWER", "MANAGE_DEVICES")).toThrow(
      AuthorizationError,
    );
  });
});
