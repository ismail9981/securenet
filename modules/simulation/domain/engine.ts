import { createHash } from "node:crypto";

import type { DeviceStatus, DeviceType } from "@/modules/shared/domain/network";
import type { ScenarioCode } from "@/modules/simulation/domain/scenarios";
import {
  createDeterministicRandom,
  mixSeed,
} from "@/modules/simulation/domain/prng";

export const SIMULATION_CYCLE_MS = 5_000;
export const NORMAL_PERSISTENCE_MS = 60_000;

const BASELINES: Readonly<
  Record<
    DeviceType,
    {
      readonly cpu: readonly [number, number];
      readonly ram: readonly [number, number];
      readonly ping: readonly [number, number];
    }
  >
> = {
  FIREWALL: { cpu: [18, 45], ram: [35, 60], ping: [2, 8] },
  ROUTER: { cpu: [12, 35], ram: [30, 55], ping: [2, 12] },
  SWITCH: { cpu: [8, 28], ram: [25, 50], ping: [1, 6] },
  SERVER: { cpu: [20, 65], ram: [40, 75], ping: [2, 15] },
  AP: { cpu: [10, 40], ram: [30, 65], ping: [3, 20] },
  WORKSTATION: { cpu: [5, 55], ram: [25, 70], ping: [2, 25] },
  PRINTER: { cpu: [1, 15], ram: [10, 35], ping: [5, 35] },
  NAS: { cpu: [15, 55], ram: [35, 70], ping: [2, 12] },
};

export interface SimulationMetricInput {
  readonly deviceId: string;
  readonly type: DeviceType;
  readonly status: DeviceStatus;
  readonly cpuPct: number | null;
  readonly ramPct: number | null;
  readonly pingMs: number | null;
  readonly packetLossPct: number | null;
  readonly downloadMbps: number | null;
  readonly uploadMbps: number | null;
}

export interface SimulationMetricOutput extends SimulationMetricInput {
  readonly diskPct: null;
  readonly uptimeSeconds: null;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function identifierSeed(value: string): number {
  return createHash("sha256").update(value).digest().readUInt32BE(0);
}

function walk(
  current: number | null,
  range: readonly [number, number],
  random: () => number,
): number {
  const midpoint = (range[0] + range[1]) / 2;
  const initial = current ?? midpoint;
  const randomStep = (random() * 2 - 1) * 8;
  const meanReversion = (midpoint - initial) * 0.18;
  return round(clamp(initial + randomStep + meanReversion, range[0], range[1]));
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function calculateProgress(
  startedAt: Date,
  now: Date,
  durationSeconds: number,
): number {
  const elapsed = Math.max(0, now.getTime() - startedAt.getTime());
  return Math.max(
    0,
    Math.min(100, Math.floor((elapsed / (durationSeconds * 1_000)) * 100)),
  );
}

export function deterministicBatchKey(
  runId: string,
  tickNumber: number,
): string {
  const bytes = createHash("sha256")
    .update(`${runId}:${tickNumber}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function generateSimulationMetric(input: {
  readonly metric: SimulationMetricInput;
  readonly scenarioCode: ScenarioCode | null;
  readonly seed: number;
  readonly tickNumber: number;
  readonly progress: number;
}): SimulationMetricOutput {
  const { metric, scenarioCode, tickNumber } = input;
  const progress = clamp(input.progress / 100, 0, 1);
  const random = createDeterministicRandom(
    mixSeed(input.seed, tickNumber, identifierSeed(metric.deviceId)),
  );
  const baseline = BASELINES[metric.type];

  let cpuPct = walk(metric.cpuPct, baseline.cpu, random);
  let ramPct = walk(metric.ramPct, baseline.ram, random);
  let pingMs = walk(metric.pingMs, baseline.ping, random);
  let packetLossPct = round(clamp(metric.packetLossPct ?? 0, 0, 100));
  let downloadMbps = round(Math.max(0, metric.downloadMbps ?? 0));
  let uploadMbps = round(Math.max(0, metric.uploadMbps ?? 0));
  let status: DeviceStatus =
    metric.status === "UNKNOWN" ? "ONLINE" : metric.status;

  if (progress >= 1 && scenarioCode && scenarioCode !== "SIM-RECOVERY") {
    return {
      ...metric,
      cpuPct,
      ramPct,
      pingMs,
      packetLossPct: 0,
      downloadMbps:
        scenarioCode === "SIM-BW-SPIKE"
          ? round(downloadMbps / 2)
          : downloadMbps,
      uploadMbps:
        scenarioCode === "SIM-BW-SPIKE" ? round(uploadMbps / 2) : uploadMbps,
      status: "ONLINE",
      diskPct: null,
      uptimeSeconds: null,
    };
  }

  switch (scenarioCode) {
    case "SIM-CPU-OVERLOAD":
      cpuPct = round(92 + random() * 7);
      status = "DEGRADED";
      break;
    case "SIM-RAM-LEAK":
      ramPct = round(
        clamp(
          interpolate(metric.ramPct ?? baseline.ram[0], 96, progress),
          0,
          100,
        ),
      );
      if (ramPct >= 92) status = "DEGRADED";
      break;
    case "SIM-ROUTER-OFFLINE":
      status = "OFFLINE";
      cpuPct = 0;
      ramPct = 0;
      pingMs = 0;
      packetLossPct = 100;
      downloadMbps = 0;
      uploadMbps = 0;
      break;
    case "SIM-PACKET-LOSS":
      packetLossPct = round(8 + random() * 17);
      pingMs = round(Math.max(pingMs, baseline.ping[1] + 120 * progress));
      status = "DEGRADED";
      break;
    case "SIM-BW-SPIKE": {
      const multiplier = 1 + progress;
      downloadMbps = round(downloadMbps * multiplier);
      uploadMbps = round(uploadMbps * multiplier);
      pingMs = round(Math.max(pingMs, baseline.ping[1] * multiplier));
      status = "DEGRADED";
      break;
    }
    case "SIM-RECOVERY":
      cpuPct = round(
        interpolate(
          metric.cpuPct ?? baseline.cpu[1],
          (baseline.cpu[0] + baseline.cpu[1]) / 2,
          progress,
        ),
      );
      ramPct = round(
        interpolate(
          metric.ramPct ?? baseline.ram[1],
          (baseline.ram[0] + baseline.ram[1]) / 2,
          progress,
        ),
      );
      pingMs = round(
        interpolate(
          metric.pingMs ?? baseline.ping[1],
          (baseline.ping[0] + baseline.ping[1]) / 2,
          progress,
        ),
      );
      packetLossPct = round(
        interpolate(metric.packetLossPct ?? 0, 0, progress),
      );
      status = "ONLINE";
      break;
    case null:
      if (cpuPct >= 90 || ramPct >= 92 || pingMs >= 120 || packetLossPct >= 8) {
        status = "DEGRADED";
      } else if (status === "DEGRADED") {
        status = "ONLINE";
      }
      break;
  }

  return {
    ...metric,
    cpuPct,
    ramPct,
    pingMs,
    packetLossPct,
    downloadMbps,
    uploadMbps,
    status,
    diskPct: null,
    uptimeSeconds: null,
  };
}

export function baselineRanges(type: DeviceType) {
  return BASELINES[type];
}
