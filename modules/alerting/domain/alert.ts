import { z } from "zod";

import {
  alertSeveritySchema,
  alertStatusSchema,
  userRoleSchema,
  deviceStatusSchema,
  type AlertSeverity,
  type AlertStatus,
  type DeviceStatus,
  type UserRole,
} from "@/modules/shared/domain/network";

export const ALERT_METRICS = [
  "CPU",
  "RAM",
  "DISK",
  "PING",
  "PACKET_LOSS",
  "STATUS",
  "BANDWIDTH",
] as const;
export const ALERT_OPERATORS = ["GT", "GTE", "LT", "LTE", "EQ"] as const;
export const ALERT_SOURCES = ["METRIC_RULE", "DEVICE_STATUS"] as const;

export const alertMetricSchema = z.enum(ALERT_METRICS);
export const alertOperatorSchema = z.enum(ALERT_OPERATORS);
export const alertSourceSchema = z.enum(ALERT_SOURCES);
export const alertIdSchema = z.string().uuid();

const optionalDate = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .optional();

export const alertListQuerySchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
    severities: z.array(alertSeveritySchema).max(3).default([]),
    statuses: z.array(alertStatusSchema).max(4).default([]),
    deviceId: z.string().uuid().optional(),
    deviceStatus: deviceStatusSchema.optional(),
    from: optionalDate,
    to: optionalDate,
  })
  .refine(({ from, to }) => !from || !to || from.getTime() <= to.getTime(), {
    message: "The from date must be before or equal to the to date.",
    path: ["from"],
  })
  .refine(
    ({ from, to }) =>
      !from ||
      !to ||
      to.getTime() - from.getTime() <= 30 * 24 * 60 * 60 * 1_000,
    {
      message: "The selected period cannot exceed 30 days.",
      path: ["to"],
    },
  );

const optionalNote = z
  .string()
  .trim()
  .max(1_000)
  .transform((value) => value || null)
  .optional()
  .default(null);

export const acknowledgeAlertSchema = z.object({
  note: optionalNote,
});

export const investigateAlertSchema = z.object({}).strict();

export const resolveAlertSchema = z.object({
  resolutionNote: optionalNote,
  overrideReason: optionalNote,
});

export interface AlertRuleDefinition {
  readonly id: string;
  readonly code: string;
  readonly metric: (typeof ALERT_METRICS)[number];
  readonly operator: (typeof ALERT_OPERATORS)[number];
  readonly warningThreshold: number | null;
  readonly criticalThreshold: number | null;
  readonly durationSeconds: number;
  readonly consecutiveSamples: number | null;
  readonly enabled: boolean;
}

export interface MetricSample {
  readonly cpuPct: number | null;
  readonly ramPct: number | null;
  readonly diskPct: number | null;
  readonly pingMs: number | null;
  readonly packetLossPct: number | null;
  readonly status: DeviceStatus;
  readonly sourceTime: Date;
  readonly stale: boolean;
}

export interface EvaluatedDevice {
  readonly id: string;
  readonly hostname: string;
  readonly status: DeviceStatus;
  readonly archived: boolean;
}

export interface RuleTrigger {
  readonly severity: AlertSeverity;
  readonly source: "METRIC_RULE" | "DEVICE_STATUS";
  readonly observedValue: number | DeviceStatus;
  readonly threshold: number | DeviceStatus;
  readonly triggeredAt: Date;
}

function compare(
  left: number,
  operator: AlertRuleDefinition["operator"],
  right: number,
): boolean {
  switch (operator) {
    case "GT":
      return left > right;
    case "GTE":
      return left >= right;
    case "LT":
      return left < right;
    case "LTE":
      return left <= right;
    case "EQ":
      return left === right;
  }
}

function metricValue(
  metric: AlertRuleDefinition["metric"],
  sample: MetricSample,
): number | null {
  switch (metric) {
    case "CPU":
      return sample.cpuPct;
    case "RAM":
      return sample.ramPct;
    case "DISK":
      return sample.diskPct;
    case "PING":
      return sample.pingMs;
    case "PACKET_LOSS":
      return sample.packetLossPct;
    case "STATUS":
    case "BANDWIDTH":
      return null;
  }
}

function conditionSatisfied(
  matches: readonly MetricSample[],
  rule: AlertRuleDefinition,
): boolean {
  if (!matches.length) return false;

  if (rule.consecutiveSamples) {
    return matches.length >= rule.consecutiveSamples;
  }

  if (rule.durationSeconds > 0) {
    const first = matches[0];
    const last = matches.at(-1);
    if (!first || !last) return false;
    return (
      last.sourceTime.getTime() - first.sourceTime.getTime() >=
      rule.durationSeconds * 1_000
    );
  }

  return true;
}

function trailingMatches(
  samples: readonly MetricSample[],
  predicate: (sample: MetricSample) => boolean,
): readonly MetricSample[] {
  const matches: MetricSample[] = [];
  for (let index = samples.length - 1; index >= 0; index -= 1) {
    const sample = samples[index];
    if (!sample || !predicate(sample)) break;
    matches.unshift(sample);
  }
  return matches;
}

export function evaluateAlertRule(
  rule: AlertRuleDefinition,
  device: EvaluatedDevice,
  samples: readonly MetricSample[],
): RuleTrigger | null {
  if (
    !rule.enabled ||
    device.archived ||
    device.status === "MAINTENANCE" ||
    rule.metric === "BANDWIDTH"
  ) {
    return null;
  }

  const usable = [...samples]
    .filter((sample) => !sample.stale)
    .sort(
      (left, right) => left.sourceTime.getTime() - right.sourceTime.getTime(),
    );
  const latest = usable.at(-1);
  if (!latest) return null;

  if (rule.metric === "STATUS") {
    const matches = trailingMatches(
      usable,
      (sample) => sample.status === "OFFLINE",
    );
    if (!conditionSatisfied(matches, rule)) return null;
    return {
      severity: "CRITICAL",
      source: "DEVICE_STATUS",
      observedValue: latest.status,
      threshold: "OFFLINE",
      triggeredAt: latest.sourceTime,
    };
  }

  for (const [severity, threshold] of [
    ["CRITICAL", rule.criticalThreshold],
    ["WARNING", rule.warningThreshold],
  ] as const) {
    if (threshold === null) continue;
    const matches = trailingMatches(usable, (sample) => {
      const value = metricValue(rule.metric, sample);
      return value !== null && compare(value, rule.operator, threshold);
    });
    if (!conditionSatisfied(matches, rule)) continue;
    const observedValue = metricValue(rule.metric, latest);
    if (observedValue === null) return null;
    return {
      severity,
      source: "METRIC_RULE",
      observedValue,
      threshold,
      triggeredAt: latest.sourceTime,
    };
  }

  return null;
}

export type AlertLifecycleCommand = "ACKNOWLEDGE" | "INVESTIGATE" | "RESOLVE";

export class AlertLifecycleError extends Error {
  constructor(
    readonly code:
      | "ALERT_INVALID_STATE"
      | "ALERT_OVERRIDE_REASON_REQUIRED"
      | "ALERT_CONDITION_NOT_CLEARED",
    message: string,
  ) {
    super(message);
    this.name = "AlertLifecycleError";
  }
}

export function nextAlertStatus(input: {
  readonly current: AlertStatus;
  readonly command: AlertLifecycleCommand;
  readonly role: UserRole;
  readonly conditionActive: boolean;
  readonly overrideReason?: string | null;
}): AlertStatus {
  const role = userRoleSchema.parse(input.role);
  const current = alertStatusSchema.parse(input.current);

  if (input.command === "ACKNOWLEDGE") {
    if (current !== "OPEN") {
      throw new AlertLifecycleError(
        "ALERT_INVALID_STATE",
        "Only an open Alert can be acknowledged.",
      );
    }
    return "ACKNOWLEDGED";
  }

  if (input.command === "INVESTIGATE") {
    if (current !== "ACKNOWLEDGED") {
      throw new AlertLifecycleError(
        "ALERT_INVALID_STATE",
        "Only an acknowledged Alert can enter investigation.",
      );
    }
    return "INVESTIGATING";
  }

  if (current === "RESOLVED") {
    throw new AlertLifecycleError(
      "ALERT_INVALID_STATE",
      "A resolved Alert cannot be resolved again.",
    );
  }
  if (role === "NETWORK_ENGINEER" && current === "OPEN") {
    throw new AlertLifecycleError(
      "ALERT_INVALID_STATE",
      "A Network Engineer must acknowledge an Alert before resolving it.",
    );
  }

  const overrideReason = input.overrideReason?.trim() ?? "";
  if (role === "ADMIN" && current === "OPEN" && !overrideReason) {
    throw new AlertLifecycleError(
      "ALERT_OVERRIDE_REASON_REQUIRED",
      "An Administrator override reason is required to resolve an open Alert.",
    );
  }
  if (input.conditionActive && (role !== "ADMIN" || !overrideReason)) {
    throw new AlertLifecycleError(
      "ALERT_CONDITION_NOT_CLEARED",
      "The Alert condition is still active.",
    );
  }

  return "RESOLVED";
}

export type AlertListQuery = z.infer<typeof alertListQuerySchema>;
export type AcknowledgeAlertInput = z.infer<typeof acknowledgeAlertSchema>;
export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;
