export const HEALTH_LABELS = [
  "EXCELLENT",
  "HEALTHY",
  "WARNING",
  "CRITICAL",
] as const;

export type HealthLabel = (typeof HEALTH_LABELS)[number];

export interface DocumentedHealthFactors {
  readonly offlineCriticalDevices: number;
  readonly openCriticalAlerts: number;
  readonly openWarningAlerts: number;
}

export interface HealthScoreResult {
  readonly score: number;
  readonly label: HealthLabel;
  readonly deductions: {
    readonly offlineDevices: number;
    readonly criticalAlerts: number;
    readonly warningAlerts: number;
    readonly total: number;
  };
  readonly formulaComplete: false;
  readonly unresolvedFactors: readonly [
    "AVERAGE_PACKET_LOSS",
    "AVERAGE_PING",
    "DEGRADED_DEVICE_RATIO",
  ];
}

function normalizeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function classifyHealthScore(score: number): HealthLabel {
  if (score >= 98) return "EXCELLENT";
  if (score >= 90) return "HEALTHY";
  if (score >= 75) return "WARNING";
  return "CRITICAL";
}

export function calculateDocumentedHealthScore(
  factors: DocumentedHealthFactors,
): HealthScoreResult {
  const offlineDevices = Math.min(
    25,
    normalizeCount(factors.offlineCriticalDevices) * 5,
  );
  const criticalAlerts = Math.min(
    24,
    normalizeCount(factors.openCriticalAlerts) * 4,
  );
  const warningAlerts = Math.min(10, normalizeCount(factors.openWarningAlerts));
  const total = offlineDevices + criticalAlerts + warningAlerts;
  const score = Math.max(0, Math.min(100, 100 - total));

  return {
    score,
    label: classifyHealthScore(score),
    deductions: {
      offlineDevices,
      criticalAlerts,
      warningAlerts,
      total,
    },
    formulaComplete: false,
    unresolvedFactors: [
      "AVERAGE_PACKET_LOSS",
      "AVERAGE_PING",
      "DEGRADED_DEVICE_RATIO",
    ],
  };
}
