import type { UserRole } from "@/modules/shared/domain/network";

export const PERMISSIONS = [
  "VIEW_DASHBOARD",
  "VIEW_DEVICES",
  "MANAGE_DEVICES",
  "ACKNOWLEDGE_ALERTS",
  "RUN_SIMULATION",
  "MANAGE_ALERT_RULES",
  "MANAGE_USERS",
  "VIEW_AUDIT_LOG",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Readonly<Record<UserRole, ReadonlySet<Permission>>> = {
  ADMIN: new Set(PERMISSIONS),
  NETWORK_ENGINEER: new Set([
    "VIEW_DASHBOARD",
    "VIEW_DEVICES",
    "ACKNOWLEDGE_ALERTS",
    "VIEW_AUDIT_LOG",
  ]),
  VIEWER: new Set(["VIEW_DASHBOARD", "VIEW_DEVICES"]),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new AuthorizationError(permission);
  }
}

export class AuthorizationError extends Error {
  readonly code = "AUTH_FORBIDDEN";

  constructor(readonly permission: Permission) {
    super("You do not have permission to perform this action.");
    this.name = "AuthorizationError";
  }
}
