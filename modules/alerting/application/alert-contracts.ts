import type {
  AlertSeverity,
  AlertStatus,
} from "@/modules/shared/domain/network";

export interface AlertDeviceReference {
  readonly id: string;
  readonly name: string;
  readonly hostname: string;
  readonly archived: boolean;
}

export interface AlertUserReference {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface AlertRuleReference {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}

export interface AlertRecord {
  readonly id: string;
  readonly device: AlertDeviceReference;
  readonly alertRule: AlertRuleReference | null;
  readonly title: string;
  readonly description: string;
  readonly severity: AlertSeverity;
  readonly status: AlertStatus;
  readonly source: "METRIC_RULE" | "DEVICE_STATUS";
  readonly openedAt: string;
  readonly lastTriggeredAt: string;
  readonly acknowledgedAt: string | null;
  readonly acknowledgedBy: AlertUserReference | null;
  readonly acknowledgementNote: string | null;
  readonly assignee: AlertUserReference | null;
  readonly resolvedAt: string | null;
  readonly resolvedBy: AlertUserReference | null;
  readonly resolutionNote: string | null;
}

export interface AlertPage {
  readonly data: readonly AlertRecord[];
  readonly meta: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
    readonly totalPages: number;
    readonly severitySummary: Readonly<Record<AlertSeverity, number>>;
  };
}

export interface AlertLifecycleResult {
  readonly alert: AlertRecord;
  readonly eventId: string;
}

export interface MetricBatchDevice {
  readonly id: string;
  readonly hostname: string;
  readonly status:
    "ONLINE" | "DEGRADED" | "OFFLINE" | "MAINTENANCE" | "UNKNOWN";
  readonly archived: boolean;
  readonly samples: readonly {
    readonly cpuPct: number | null;
    readonly ramPct: number | null;
    readonly diskPct: number | null;
    readonly pingMs: number | null;
    readonly packetLossPct: number | null;
    readonly status:
      "ONLINE" | "DEGRADED" | "OFFLINE" | "MAINTENANCE" | "UNKNOWN";
    readonly sourceTime: Date;
    readonly stale: boolean;
  }[];
}

export interface AcceptedMetricBatch {
  readonly batchKey: string;
  readonly devices: readonly MetricBatchDevice[];
}

export interface MetricBatchEvaluationResult {
  readonly opened: number;
  readonly retriggered: number;
}
