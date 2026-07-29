import { describe, expect, it } from "vitest";

import {
  baselineRanges,
  calculateProgress,
  deterministicBatchKey,
  generateSimulationMetric,
} from "@/modules/simulation/domain/engine";
import type { SimulationMetricInput } from "@/modules/simulation/domain/engine";
import {
  createDeterministicRandom,
  SIMULATION_ENGINE_VERSION,
} from "@/modules/simulation/domain/prng";
import { SCENARIOS } from "@/modules/simulation/domain/scenarios";

const metric = {
  deviceId: "30000000-0000-4000-8000-000000000008",
  type: "SERVER" as const,
  status: "ONLINE" as const,
  cpuPct: 42,
  ramPct: 55,
  pingMs: 8,
  packetLossPct: 0.5,
  downloadMbps: 100,
  uploadMbps: 40,
};

describe("deterministic simulation domain", () => {
  it("keeps the approved scenario allow-list and durations", () => {
    expect(
      Object.fromEntries(
        Object.values(SCENARIOS).map(({ code, durationSeconds }) => [
          code,
          durationSeconds,
        ]),
      ),
    ).toEqual({
      "SIM-CPU-OVERLOAD": 120,
      "SIM-RAM-LEAK": 180,
      "SIM-ROUTER-OFFLINE": 90,
      "SIM-PACKET-LOSS": 120,
      "SIM-BW-SPIKE": 90,
      "SIM-RECOVERY": 60,
    });
    expect(Object.keys(SCENARIOS)).not.toContain("SIM-MULTI-FAIL");
    expect(SIMULATION_ENGINE_VERSION).toBe(1);
  });

  it("produces the same sequence for the same seed and another for a different seed", () => {
    const first = createDeterministicRandom(123456);
    const replay = createDeterministicRandom(123456);
    const different = createDeterministicRandom(654321);
    const sequence = Array.from({ length: 6 }, () => first());
    expect(Array.from({ length: 6 }, () => replay())).toEqual(sequence);
    expect(Array.from({ length: 6 }, () => different())).not.toEqual(sequence);
  });

  it("uses the documented Server baseline ranges and bounded mean-reverting walk", () => {
    const range = baselineRanges("SERVER");
    expect(range).toEqual({ cpu: [20, 65], ram: [40, 75], ping: [2, 15] });
    let current: SimulationMetricInput = {
      ...metric,
      cpuPct: 100,
      ramPct: 0,
      pingMs: 100,
    };
    for (let tickNumber = 0; tickNumber < 20; tickNumber += 1) {
      current = generateSimulationMetric({
        metric: current,
        scenarioCode: "SIM-RECOVERY",
        seed: 99,
        tickNumber,
        progress: 100,
      });
      expect(current.cpuPct).toBeGreaterThanOrEqual(20);
      expect(current.cpuPct).toBeLessThanOrEqual(65);
      expect(current.ramPct).toBeGreaterThanOrEqual(40);
      expect(current.ramPct).toBeLessThanOrEqual(75);
      expect(current.pingMs).toBeGreaterThanOrEqual(2);
      expect(current.pingMs).toBeLessThanOrEqual(15);
    }
  });

  it.each([
    ["SIM-CPU-OVERLOAD", 95, { status: "DEGRADED" }],
    ["SIM-RAM-LEAK", 95, { status: "DEGRADED" }],
    ["SIM-PACKET-LOSS", 95, { status: "DEGRADED" }],
    ["SIM-BW-SPIKE", 95, { status: "DEGRADED" }],
    ["SIM-RECOVERY", 100, { status: "ONLINE" }],
  ] as const)(
    "applies %s deterministically",
    (scenarioCode, progress, expected) => {
      const first = generateSimulationMetric({
        metric,
        scenarioCode,
        seed: 123456,
        tickNumber: 12,
        progress,
      });
      const replay = generateSimulationMetric({
        metric,
        scenarioCode,
        seed: 123456,
        tickNumber: 12,
        progress,
      });
      expect(first).toEqual(replay);
      expect(first).toMatchObject(expected);
      expect(first.diskPct).toBeNull();
      expect(first.uptimeSeconds).toBeNull();
    },
  );

  it("sets a Router Offline without inventing unsupported observations", () => {
    expect(
      generateSimulationMetric({
        metric: { ...metric, type: "ROUTER" },
        scenarioCode: "SIM-ROUTER-OFFLINE",
        seed: 1,
        tickNumber: 0,
        progress: 0,
      }),
    ).toMatchObject({
      status: "OFFLINE",
      cpuPct: 0,
      ramPct: 0,
      pingMs: 0,
      packetLossPct: 100,
      downloadMbps: 0,
      uploadMbps: 0,
      diskPct: null,
      uptimeSeconds: null,
    });
  });

  it("clamps progress and creates deterministic UUID batch keys", () => {
    const startedAt = new Date("2026-07-27T00:00:00.000Z");
    expect(
      calculateProgress(startedAt, new Date("2026-07-26T23:00:00Z"), 60),
    ).toBe(0);
    expect(
      calculateProgress(startedAt, new Date("2026-07-27T00:00:30Z"), 60),
    ).toBe(50);
    expect(
      calculateProgress(startedAt, new Date("2026-07-27T00:02:00Z"), 60),
    ).toBe(100);
    expect(deterministicBatchKey("run-1", 12)).toBe(
      deterministicBatchKey("run-1", 12),
    );
    expect(deterministicBatchKey("run-1", 12)).not.toBe(
      deterministicBatchKey("run-1", 13),
    );
    expect(deterministicBatchKey("run-1", 12)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("generates a 30-Device Demo cycle within the local 250 ms budget", () => {
    const started = performance.now();
    for (let index = 1; index <= 30; index += 1) {
      generateSimulationMetric({
        metric: {
          ...metric,
          deviceId: `30000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
        },
        scenarioCode: null,
        seed: 123456,
        tickNumber: 12,
        progress: 0,
      });
    }
    expect(performance.now() - started).toBeLessThan(250);
  });
});
