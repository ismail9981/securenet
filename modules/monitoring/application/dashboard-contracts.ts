import { z } from "zod";

import {
  alertSeveritySchema,
  deviceStatusSchema,
} from "@/modules/shared/domain/network";

export const healthLabelSchema = z.enum([
  "EXCELLENT",
  "HEALTHY",
  "WARNING",
  "CRITICAL",
]);

export const dashboardSnapshotSchema = z.object({
  source: z.enum(["SIMULATION_FIXTURE", "SIMULATION_DATABASE"]),
  generatedAt: z.string().datetime(),
  rangeLabel: z.string(),
  summary: z.object({
    totalDevices: z.number().int().nonnegative(),
    onlineDevices: z.number().int().nonnegative(),
    degradedDevices: z.number().int().nonnegative(),
    offlineDevices: z.number().int().nonnegative(),
    openCriticalAlerts: z.number().int().nonnegative(),
    openWarningAlerts: z.number().int().nonnegative(),
    staleDeviceCount: z.number().int().nonnegative(),
  }),
  networkHealth: z.object({
    score: z.number().int().min(0).max(100),
    label: healthLabelSchema,
    formulaComplete: z.literal(false),
    deductionTotal: z.number().int().nonnegative(),
    unresolvedFactors: z.array(z.string()),
  }),
  traffic: z.array(
    z.object({
      time: z.string(),
      downloadMbps: z.number().nonnegative(),
      uploadMbps: z.number().nonnegative(),
    }),
  ),
  deviceDistribution: z.array(
    z.object({
      status: deviceStatusSchema,
      count: z.number().int().nonnegative(),
    }),
  ),
  latestAlerts: z.array(
    z.object({
      id: z.string(),
      deviceName: z.string(),
      title: z.string(),
      severity: alertSeveritySchema,
      openedAt: z.string().datetime(),
    }),
  ),
  recentEvents: z.array(
    z.object({
      id: z.string(),
      message: z.string(),
      type: z.string(),
      createdAt: z.string().datetime(),
    }),
  ),
});

export type DashboardSnapshot = z.infer<typeof dashboardSnapshotSchema>;
