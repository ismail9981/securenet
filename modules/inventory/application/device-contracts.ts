import type { DeviceStatus, DeviceType } from "@/modules/shared/domain/network";

export interface LocationOption {
  readonly id: string;
  readonly name: string;
}

export interface MetricSnapshot {
  readonly id: string;
  readonly cpuPct: number | null;
  readonly ramPct: number | null;
  readonly diskPct: number | null;
  readonly pingMs: number | null;
  readonly packetLossPct: number | null;
  readonly downloadMbps: number | null;
  readonly uploadMbps: number | null;
  readonly uptimeSeconds: number | null;
  readonly sourceTime: string;
  readonly receivedAt: string;
  readonly stale: boolean;
}

export interface DeviceSummary {
  readonly id: string;
  readonly name: string;
  readonly hostname: string;
  readonly type: DeviceType;
  readonly ipAddress: string;
  readonly status: DeviceStatus;
  readonly location: LocationOption;
  readonly latestMetrics: MetricSnapshot | null;
  readonly lastSeenAt: string | null;
  readonly activeAlertCount: number;
}

export interface DeviceDetails extends DeviceSummary {
  readonly macAddress: string | null;
  readonly osName: string | null;
  readonly importanceWeight: number;
  readonly parentDevice: {
    readonly id: string;
    readonly name: string;
    readonly hostname: string;
  } | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DevicePage {
  readonly data: readonly DeviceSummary[];
  readonly meta: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

export interface MetricPage {
  readonly data: readonly MetricSnapshot[];
  readonly meta: {
    readonly nextCursor: string | null;
  };
}
