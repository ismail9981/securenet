import { logEvent } from "@/lib/logger";
import { publishRealtimeSafely } from "@/modules/realtime/infrastructure/in-process-realtime-publisher";
import type { RealtimeEventInput } from "@/modules/realtime/application/realtime-contracts";
import type { SimulationRepository } from "@/modules/simulation/application/simulation-repository";
import { SIMULATION_CYCLE_MS } from "@/modules/simulation/domain/engine";
import {
  publishSimulationStatus,
  publishSimulationStatusCrossProcess,
} from "@/modules/simulation/infrastructure/simulation-realtime";

export interface RuntimeClock {
  now(): Date;
  sleep(milliseconds: number): Promise<void>;
}

export const systemRuntimeClock: RuntimeClock = {
  now: () => new Date(),
  sleep: (milliseconds) =>
    new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    }),
};

export class SimulationRuntime {
  private stopped = false;
  private lastBaselineAt: Date | null = null;

  constructor(
    private readonly repository: SimulationRepository,
    private readonly clock: RuntimeClock = systemRuntimeClock,
  ) {}

  stop(): void {
    this.stopped = true;
  }

  async recoverOrphans(): Promise<void> {
    const failed = await this.repository.failOrphanedRuns();
    for (const run of failed) {
      publishSimulationStatus(run);
      await publishSimulationStatusCrossProcess(run);
      await this.publishFailureEvent(run.id);
    }
  }

  async cycle(): Promise<void> {
    const now = this.clock.now();
    if (
      this.lastBaselineAt === null ||
      now.getTime() - this.lastBaselineAt.getTime() >= 60_000
    ) {
      try {
        const baseline = await this.repository.executeBaselineTick(now);
        this.lastBaselineAt = now;
        if (!baseline.duplicate) {
          const { alertService } =
            await import("@/modules/alerting/infrastructure/alert-service");
          await alertService.evaluateAcceptedMetricBatch(
            await this.repository.acceptedBaselineBatch(baseline.batchKey),
          );
          await this.publishAlertBatch(baseline.batchKey);
          await this.publishCommittedChanges(
            baseline.changedDeviceIds,
            baseline.eventIds,
          );
        }
      } catch (error) {
        logEvent("error", "simulation.baseline.failed", {
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      }
    }

    const runs = await this.repository.listRunning();
    for (const run of runs) {
      try {
        const result = await this.repository.executeTick(run.id, now);
        if (!result || result.duplicate) continue;

        if (result.batchKey) {
          const { alertService } =
            await import("@/modules/alerting/infrastructure/alert-service");
          const batch = await this.repository.acceptedBatch(
            run.id,
            result.batchKey,
          );
          await alertService.evaluateAcceptedMetricBatch(batch);
          await this.publishAlertBatch(result.batchKey);
        }

        await this.publishCommittedChanges(
          result.changedDeviceIds,
          result.eventIds,
        );
        publishSimulationStatus(result.run);
        await publishSimulationStatusCrossProcess(result.run);
      } catch (error) {
        logEvent("error", "simulation.tick.failed", {
          runId: run.id,
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
        const failed = await this.repository.failRun(
          run.id,
          "TICK_PROCESSING_FAILED",
        );
        if (failed) {
          publishSimulationStatus(failed);
          await publishSimulationStatusCrossProcess(failed);
          await this.publishFailureEvent(failed.id);
        }
      }
    }
  }

  private async publishCommittedChanges(
    changedDeviceIds: readonly string[],
    eventIds: readonly string[],
  ): Promise<void> {
    const { prisma } = await import("@/lib/prisma");
    for (const deviceId of changedDeviceIds) {
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: {
          metrics: {
            orderBy: [{ sourceTime: "desc" }, { id: "desc" }],
            take: 1,
          },
        },
      });
      if (!device) continue;
      const latest = device.metrics[0];
      await this.publish({
        eventType: "device.updated",
        entityType: "device",
        entityId: device.id,
        payload: {
          deviceId: device.id,
          status: device.status,
          latestMetrics: latest
            ? {
                cpuPct: latest.cpuPct === null ? null : Number(latest.cpuPct),
                ramPct: latest.ramPct === null ? null : Number(latest.ramPct),
                pingMs: latest.pingMs === null ? null : Number(latest.pingMs),
                packetLossPct:
                  latest.packetLossPct === null
                    ? null
                    : Number(latest.packetLossPct),
                sourceTime: latest.sourceTime.toISOString(),
              }
            : null,
          lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
        },
      });
    }
    for (const eventId of eventIds) {
      await this.publish({
        eventType: "event.created",
        entityType: "event",
        entityId: eventId,
        payload: { event: { id: eventId } },
      });
    }
  }

  private async publishAlertBatch(batchKey: string): Promise<void> {
    const { prisma } = await import("@/lib/prisma");
    const events = await prisma.event.findMany({
      where: {
        type: { in: ["ALERT_OPENED", "ALERT_RETRIGGERED"] },
        payload: { path: ["batchKey"], equals: batchKey },
      },
      select: { id: true, alertId: true, type: true },
    });
    for (const event of events) {
      if (event.alertId) {
        await this.publish({
          eventType:
            event.type === "ALERT_OPENED" ? "alert.created" : "alert.updated",
          entityType: "alert",
          entityId: event.alertId,
          payload:
            event.type === "ALERT_OPENED"
              ? { alert: { id: event.alertId } }
              : {
                  alertId: event.alertId,
                  status: "OPEN",
                  actor: null,
                  timestamp: new Date().toISOString(),
                },
        });
      }
      await this.publish({
        eventType: "event.created",
        entityType: "event",
        entityId: event.id.toString(),
        payload: { event: { id: event.id.toString() } },
      });
    }
  }

  private async publishFailureEvent(runId: string): Promise<void> {
    const { prisma } = await import("@/lib/prisma");
    const event = await prisma.event.findFirst({
      where: { simulationRunId: runId, type: "SIMULATION_FAILED" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true },
    });
    if (event) {
      await this.publish({
        eventType: "event.created",
        entityType: "event",
        entityId: event.id.toString(),
        payload: { event: { id: event.id.toString() } },
      });
    }
  }

  private async publish(input: RealtimeEventInput): Promise<void> {
    publishRealtimeSafely(input);
    try {
      const { publishCrossProcessRealtime } =
        await import("@/modules/realtime/infrastructure/postgres-realtime-bridge");
      await publishCrossProcessRealtime(input);
    } catch (error) {
      logEvent("error", "simulation.realtime.bridge-failed", {
        eventType: input.eventType,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  async run(): Promise<void> {
    await this.recoverOrphans();
    while (!this.stopped) {
      await this.cycle();
      if (!this.stopped) await this.clock.sleep(SIMULATION_CYCLE_MS);
    }
  }
}
