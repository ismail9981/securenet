import type { DashboardSnapshot } from "@/modules/monitoring/application/dashboard-contracts";
import type { DashboardRepository } from "@/modules/monitoring/application/dashboard-repository";
import { calculateDocumentedHealthScore } from "@/modules/monitoring/domain/health-score";

const summary = {
  totalDevices: 30,
  onlineDevices: 24,
  degradedDevices: 4,
  offlineDevices: 2,
  openCriticalAlerts: 2,
  openWarningAlerts: 3,
  staleDeviceCount: 1,
} as const;

const health = calculateDocumentedHealthScore({
  offlineCriticalDevices: summary.offlineDevices,
  openCriticalAlerts: summary.openCriticalAlerts,
  openWarningAlerts: summary.openWarningAlerts,
});

const SNAPSHOT: DashboardSnapshot = {
  source: "SIMULATION_FIXTURE",
  generatedAt: "2026-07-24T08:00:00.000Z",
  rangeLabel: "Last 24 hours · deterministic fixture",
  summary,
  networkHealth: {
    score: health.score,
    label: health.label,
    formulaComplete: health.formulaComplete,
    deductionTotal: health.deductions.total,
    unresolvedFactors: [...health.unresolvedFactors],
  },
  traffic: [
    { time: "00:00", downloadMbps: 168, uploadMbps: 42 },
    { time: "02:00", downloadMbps: 142, uploadMbps: 36 },
    { time: "04:00", downloadMbps: 131, uploadMbps: 31 },
    { time: "06:00", downloadMbps: 196, uploadMbps: 48 },
    { time: "08:00", downloadMbps: 322, uploadMbps: 76 },
    { time: "10:00", downloadMbps: 448, uploadMbps: 102 },
    { time: "12:00", downloadMbps: 516, uploadMbps: 128 },
    { time: "14:00", downloadMbps: 487, uploadMbps: 116 },
    { time: "16:00", downloadMbps: 421, uploadMbps: 96 },
    { time: "18:00", downloadMbps: 374, uploadMbps: 88 },
    { time: "20:00", downloadMbps: 286, uploadMbps: 68 },
    { time: "22:00", downloadMbps: 214, uploadMbps: 52 },
  ],
  deviceDistribution: [
    { status: "ONLINE", count: summary.onlineDevices },
    { status: "DEGRADED", count: summary.degradedDevices },
    { status: "OFFLINE", count: summary.offlineDevices },
    { status: "MAINTENANCE", count: 0 },
    { status: "UNKNOWN", count: 0 },
  ],
  latestAlerts: [
    {
      id: "alt-demo-001",
      deviceName: "RTR-CORE-01",
      title: "Core router is offline",
      severity: "CRITICAL",
      openedAt: "2026-07-24T07:54:00.000Z",
    },
    {
      id: "alt-demo-002",
      deviceName: "SRV-APP-01",
      title: "CPU threshold exceeded",
      severity: "CRITICAL",
      openedAt: "2026-07-24T07:48:00.000Z",
    },
    {
      id: "alt-demo-003",
      deviceName: "AP-OFFICE-01",
      title: "Elevated packet loss",
      severity: "WARNING",
      openedAt: "2026-07-24T07:41:00.000Z",
    },
  ],
  recentEvents: [
    {
      id: "evt-demo-001",
      type: "device.status_changed",
      message: "RTR-CORE-01 changed from Online to Offline",
      createdAt: "2026-07-24T07:54:00.000Z",
    },
    {
      id: "evt-demo-002",
      type: "alert.opened",
      message: "Critical CPU alert opened for SRV-APP-01",
      createdAt: "2026-07-24T07:48:00.000Z",
    },
    {
      id: "evt-demo-003",
      type: "device.status_changed",
      message: "AP-OFFICE-01 changed from Online to Degraded",
      createdAt: "2026-07-24T07:41:00.000Z",
    },
  ],
};

export class DemoDashboardRepository implements DashboardRepository {
  async getSnapshot(): Promise<DashboardSnapshot> {
    return structuredClone(SNAPSHOT);
  }
}
