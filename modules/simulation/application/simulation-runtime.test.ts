import { describe, expect, it, vi } from "vitest";

import type { SimulationRepository } from "@/modules/simulation/application/simulation-repository";
import { SimulationRuntime } from "@/modules/simulation/application/simulation-runtime";

function repository(): SimulationRepository {
  return {
    start: vi.fn(),
    getById: vi.fn(),
    cancel: vi.fn(),
    listRunning: vi.fn().mockResolvedValue([]),
    failOrphanedRuns: vi.fn().mockResolvedValue([]),
    failRun: vi.fn(),
    executeTick: vi.fn(),
    executeBaselineTick: vi.fn().mockResolvedValue({
      duplicate: true,
      batchKey: "00000000-0000-4000-8000-000000000001",
      changedDeviceIds: [],
      eventIds: [],
    }),
    acceptedBatch: vi.fn(),
    acceptedBaselineBatch: vi.fn(),
  };
}

describe("SimulationRuntime", () => {
  it("performs restart recovery before cycling", async () => {
    const repo = repository();
    const runtime = new SimulationRuntime(repo, {
      now: () => new Date("2026-07-27T00:00:00Z"),
      sleep: vi.fn(),
    });
    await runtime.recoverOrphans();
    expect(repo.failOrphanedRuns).toHaveBeenCalledOnce();
  });

  it("does not execute ticks when no runs are active", async () => {
    const repo = repository();
    const runtime = new SimulationRuntime(repo);
    await runtime.cycle();
    expect(repo.executeBaselineTick).toHaveBeenCalledOnce();
    expect(repo.executeTick).not.toHaveBeenCalled();
  });
});
