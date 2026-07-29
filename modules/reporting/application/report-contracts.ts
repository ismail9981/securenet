import type {
  AlertSeverity,
  AlertStatus,
  DeviceStatus,
} from "@/modules/shared/domain/network";

export interface NetworkHealthReport {
  readonly generatedAt: string;
  readonly from: string;
  readonly to: string;
  readonly timezone: string;
  readonly trafficUnit: string;
  readonly demoDisclosure: string;
  readonly deviceCounts: Readonly<Record<DeviceStatus, number>> & {
    readonly totalActive: number;
  };
  readonly alertsBySeverity: Readonly<Record<AlertSeverity, number>>;
  readonly alertsByStatus: Readonly<Record<AlertStatus, number>>;
  readonly metrics: {
    readonly averageCpu: number | null;
    readonly averageRam: number | null;
    readonly averagePing: number | null;
    readonly averagePacketLoss: number | null;
    readonly totalDownload: number;
    readonly totalUpload: number;
  };
  readonly health: {
    readonly score: number;
    readonly label: string;
    readonly formulaComplete: false;
  };
  readonly topProblemDevices: readonly {
    readonly id: string;
    readonly name: string;
    readonly hostname: string;
    readonly status: DeviceStatus;
    readonly activeAlertCount: number;
  }[];
  readonly recentAlerts: readonly {
    readonly id: string;
    readonly deviceName: string;
    readonly title: string;
    readonly severity: AlertSeverity;
    readonly status: AlertStatus;
    readonly openedAt: string;
  }[];
}

export interface AlertsCsvResult {
  readonly content: string;
  readonly filename: string;
  readonly rowCount: number;
}
