import { config } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { requireTestDatabaseUrl } from "@/lib/database-url";
import type { PublicUser } from "@/modules/identity/domain/user";
import { resetTestDatabase } from "@/scripts/reset-test-database";

config({ path: ".env.local", quiet: true });
process.env.DATABASE_URL = requireTestDatabaseUrl();

const admin: PublicUser = {
  id: "01f1c115-4481-4a6e-8d45-5b7510afbd1a",
  name: "Amina Al-Harthi",
  email: "admin@securenet.demo",
  role: "ADMIN",
};
const context = { actor: admin, requestIp: "198.51.100.50" };
const serverId = "30000000-0000-4000-8000-000000000008";
const secondServerId = "30000000-0000-4000-8000-000000000009";

let database: PrismaClient;
let repository: InstanceType<
  typeof import("@/modules/simulation/infrastructure/prisma-simulation-repository").PrismaSimulationRepository
>;
let alertService: typeof import("@/modules/alerting/infrastructure/alert-service").alertService;

describe("Prisma simulation repository", () => {
  beforeAll(async () => {
    await resetTestDatabase();
    ({ prisma: database } = await import("@/lib/prisma"));
    const { PrismaSimulationRepository } =
      await import("@/modules/simulation/infrastructure/prisma-simulation-repository");
    repository = new PrismaSimulationRepository();
    ({ alertService } =
      await import("@/modules/alerting/infrastructure/alert-service"));
  });

  afterAll(async () => database.$disconnect());

  it("starts idempotently with traceable Event and Audit records", async () => {
    const command = {
      scenarioCode: "SIM-CPU-OVERLOAD" as const,
      targetDeviceIds: [serverId],
      seed: 123456,
      idempotencyKey: "simulation-start-001",
    };
    const first = await repository.start(command, context);
    const replay = await repository.start(command, context);

    expect(replay.id).toBe(first.id);
    expect(first).toMatchObject({
      status: "RUNNING",
      seed: 123456,
      engineVersion: 1,
      durationSeconds: 120,
      progress: 0,
    });
    await expect(
      database.event.count({
        where: { simulationRunId: first.id, type: "SIMULATION_STARTED" },
      }),
    ).resolves.toBe(1);
    await expect(
      database.auditLog.count({
        where: {
          entityId: first.id,
          action: "simulation.run.started",
          actorUserId: admin.id,
        },
      }),
    ).resolves.toBe(1);
  });

  it("persists one 60-second baseline batch while excluding archived and Maintenance Devices", async () => {
    await database.device.update({
      where: { id: "30000000-0000-4000-8000-000000000029" },
      data: { status: "MAINTENANCE" },
    });
    await database.device.update({
      where: { id: "30000000-0000-4000-8000-000000000030" },
      data: { archivedAt: new Date("2026-07-27T00:00:00Z") },
    });
    const now = new Date("2026-07-27T00:01:00Z");
    const first = await repository.executeBaselineTick(now);
    const replay = await repository.executeBaselineTick(now);
    expect(first.duplicate).toBe(false);
    expect(replay.duplicate).toBe(true);
    const metrics = await database.deviceMetric.findMany({
      where: { batchKey: first.batchKey },
    });
    expect(metrics).toHaveLength(28);
    expect(
      metrics.every(
        (metric) =>
          metric.source === "SIMULATION" &&
          metric.simulationRunId === null &&
          metric.diskPct === null &&
          metric.uptimeSeconds === null,
      ),
    ).toBe(true);
  });

  it("rejects overlapping targets and permits nonoverlapping runs", async () => {
    await expect(
      repository.start(
        {
          scenarioCode: "SIM-RAM-LEAK",
          targetDeviceIds: [serverId],
          seed: 1,
          idempotencyKey: "simulation-overlap-001",
        },
        context,
      ),
    ).rejects.toMatchObject({ code: "SIMULATION_ACTIVE_CONFLICT" });

    const separate = await repository.start(
      {
        scenarioCode: "SIM-RAM-LEAK",
        targetDeviceIds: [secondServerId],
        seed: 2,
        idempotencyKey: "simulation-separate-001",
      },
      context,
    );
    expect(separate.status).toBe("RUNNING");
  });

  it("persists transition batches idempotently and opens one deduplicated Alert", async () => {
    const run = (await repository.listRunning()).find(
      (candidate) => candidate.targetDeviceIds[0] === serverId,
    );
    expect(run).toBeDefined();
    const startedAt = new Date(run?.startedAt ?? 0);
    const first = await repository.executeTick(run!.id, startedAt);
    expect(first).toMatchObject({ duplicate: false });
    expect(first?.batchKey).toEqual(expect.any(String));

    const duplicate = await repository.executeTick(run!.id, startedAt);
    expect(duplicate?.duplicate).toBe(true);

    const sixtySeconds = new Date(startedAt.getTime() + 60_000);
    const threshold = await repository.executeTick(run!.id, sixtySeconds);
    const batch = await repository.acceptedBatch(
      run!.id,
      threshold?.batchKey ?? "",
    );
    await alertService.evaluateAcceptedMetricBatch(batch);
    await alertService.evaluateAcceptedMetricBatch(batch);

    const metrics = await database.deviceMetric.findMany({
      where: { simulationRunId: run!.id },
    });
    expect(metrics).toHaveLength(2);
    expect(metrics.every((metric) => metric.source === "SIMULATION")).toBe(
      true,
    );
    await expect(
      database.alert.count({
        where: {
          deviceId: serverId,
          alertRule: { code: "AR-CPU-01" },
          status: { not: "RESOLVED" },
        },
      }),
    ).resolves.toBe(1);
  });

  it("completes at 100, preserves Alerts on recovery, and cancels without STOPPED", async () => {
    const cpuRun = (await repository.listRunning()).find(
      (candidate) => candidate.targetDeviceIds[0] === serverId,
    )!;
    const completed = await repository.executeTick(
      cpuRun.id,
      new Date(new Date(cpuRun.startedAt).getTime() + 120_000),
    );
    expect(completed?.run).toMatchObject({
      status: "COMPLETED",
      progress: 100,
    });

    const recovery = await repository.start(
      {
        scenarioCode: "SIM-RECOVERY",
        targetDeviceIds: [serverId],
        seed: 3,
        idempotencyKey: "simulation-recovery-001",
      },
      context,
    );
    await repository.executeTick(recovery.id, new Date(recovery.startedAt));
    await expect(
      database.alert.count({
        where: {
          deviceId: serverId,
          alertRule: { code: "AR-CPU-01" },
          status: { not: "RESOLVED" },
        },
      }),
    ).resolves.toBe(1);

    const cancelled = await repository.cancel(recovery.id, context);
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.progress).toBeGreaterThanOrEqual(0);
  });

  it("marks orphaned runs failed with the approved recovery reason", async () => {
    const failed = await repository.failOrphanedRuns();
    expect(failed.length).toBeGreaterThan(0);
    expect(failed.every((run) => run.status === "FAILED")).toBe(true);
    const stored = await database.simulationRun.findUnique({
      where: { id: failed[0]!.id },
    });
    expect(stored?.result).toMatchObject({
      reason: "WORKER_RESTART_RECOVERY",
    });
    await expect(
      database.deviceMetric.count({
        where: {
          simulationRunId: failed[0]!.id,
          source: "SIMULATION",
        },
      }),
    ).resolves.toBeGreaterThan(0);
  });
});
