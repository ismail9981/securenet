import { z } from "zod";

export const DEVICE_TYPES = [
  "SERVER",
  "ROUTER",
  "SWITCH",
  "FIREWALL",
  "AP",
  "WORKSTATION",
  "PRINTER",
  "NAS",
] as const;

export const DEVICE_STATUSES = [
  "ONLINE",
  "DEGRADED",
  "OFFLINE",
  "MAINTENANCE",
  "UNKNOWN",
] as const;

export const ALERT_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;
export const ALERT_STATUSES = [
  "OPEN",
  "ACKNOWLEDGED",
  "INVESTIGATING",
  "RESOLVED",
] as const;
export const USER_ROLES = ["ADMIN", "ENGINEER", "VIEWER"] as const;
export const USER_STATUSES = ["ACTIVE", "DISABLED"] as const;
export const CONNECTION_TYPES = ["ETHERNET", "WIFI", "VPN", "VIRTUAL"] as const;
export const CONNECTION_STATUSES = ["ACTIVE", "DEGRADED", "DOWN"] as const;
export const SIMULATION_STATUSES = [
  "RUNNING",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
] as const;

export const deviceTypeSchema = z.enum(DEVICE_TYPES);
export const deviceStatusSchema = z.enum(DEVICE_STATUSES);
export const alertSeveritySchema = z.enum(ALERT_SEVERITIES);
export const alertStatusSchema = z.enum(ALERT_STATUSES);
export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);
export const connectionTypeSchema = z.enum(CONNECTION_TYPES);
export const connectionStatusSchema = z.enum(CONNECTION_STATUSES);
export const simulationStatusSchema = z.enum(SIMULATION_STATUSES);

export type DeviceType = z.infer<typeof deviceTypeSchema>;
export type DeviceStatus = z.infer<typeof deviceStatusSchema>;
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;
export type AlertStatus = z.infer<typeof alertStatusSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type ConnectionType = z.infer<typeof connectionTypeSchema>;
export type ConnectionStatus = z.infer<typeof connectionStatusSchema>;
export type SimulationStatus = z.infer<typeof simulationStatusSchema>;

export interface DeviceIdentity {
  readonly id: string;
  readonly name: string;
  readonly hostname: string;
  readonly type: DeviceType;
  readonly ipAddress: string;
  readonly status: DeviceStatus;
}
