import {
  AlertSeverity,
  EventType,
  MetricSource,
  Prisma,
  SimulationStatus,
  type Device,
  type DeviceMetric,
  type SimulationRun,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AcceptedMetricBatch } from "@/modules/alerting/application/alert-contracts";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import { isMetricStale } from "@/modules/telemetry/domain/freshness";
import { publishRealtimeSafely } from "@/modules/realtime/infrastructure/in-process-realtime-publisher";
import type { SimulationRunRecord } from "@/modules/simulation/application/simulation-contracts";
import { SimulationError } from "@/modules/simulation/application/simulation-errors";
import type {
  BaselineTickResult,
  SimulationRepository,
  SimulationTickResult,
  StartRunCommand,
} from "@/modules/simulation/application/simulation-repository";
import {
  calculateProgress,
  deterministicBatchKey,
  generateSimulationMetric,
  SIMULATION_CYCLE_MS,
} from "@/modules/simulation/domain/engine";
import { SIMULATION_ENGINE_VERSION } from "@/modules/simulation/domain/prng";
import {
  isEligibleDeviceType,
  SCENARIOS,
  type ScenarioCode,
} from "@/modules/simulation/domain/scenarios";

interface RunParameters {
  readonly seed: number;
  readonly engineVersion: 1;
  readonly targetDeviceIds: readonly string[];
  readonly durationSeconds: number;
  readonly initialStatuses?: Readonly<Record<string, Device["status"]>>;
}

function parametersOf(value: Prisma.JsonValue): RunParameters {
  const parameters = value as unknown as RunParameters;
  return parameters;
}

function mapRun(run: SimulationRun): SimulationRunRecord {
  const parameters = parametersOf(run.parameters);
  return {
    id: run.id,
    scenarioCode: run.scenarioCode as ScenarioCode,
    status: run.status,
    targetDeviceIds: parameters.targetDeviceIds,
    seed: parameters.seed,
    engineVersion: parameters.engineVersion,
    durationSeconds: parameters.durationSeconds,
    progress: run.progress,
    startedAt: run.startedAt.toISOString(),
    endedAt: run.endedAt?.toISOString() ?? null,
    result: run.result as Readonly<Record<string, unknown>> | null,
  };
}

function sameStart(run: SimulationRun, command: StartRunCommand): boolean {
  const parameters = parametersOf(run.parameters);
  return (
    run.scenarioCode === command.scenarioCode &&
    parameters.seed === command.seed &&
    [...parameters.targetDeviceIds].sort().join(",") ===
      [...command.targetDeviceIds].sort().join(",")
  );
}

function decimal(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

function metricInput(device: Device, latest: DeviceMetric | undefined) {
  return {
    deviceId: device.id,
    type: device.type,
    status: device.status,
    cpuPct: decimal(latest?.cpuPct ?? null),
    ramPct: decimal(latest?.ramPct ?? null),
    pingMs: decimal(latest?.pingMs ?? null),
    packetLossPct: decimal(latest?.packetLossPct ?? null),
    downloadMbps: decimal(latest?.downloadMbps ?? null),
    uploadMbps: decimal(latest?.uploadMbps ?? null),
  };
}

function statusSeverity(status: Device["status"]): AlertSeverity {
  if (status === "OFFLINE") return AlertSeverity.CRITICAL;
  if (status === "DEGRADED") return AlertSeverity.WARNING;
  return AlertSeverity.INFO;
}

async function persistFailureCheckpoint(
  transaction: Prisma.TransactionClient,
  run: SimulationRun,
  sourceTime: Date,
): Promise<void> {
  const parameters = parametersOf(run.parameters);
  const targets = await transaction.device.findMany({
    where: {
      id: { in: [...parameters.targetDeviceIds] },
      archivedAt: null,
      status: { not: "MAINTENANCE" },
    },
    include: {
      metrics: {
        orderBy: [{ sourceTime: "desc" }, { id: "desc" }],
        take: 1,
      },
    },
  });
  const batchKey = deterministicBatchKey(run.id, 2_147_483_646);
  for (const target of targets) {
    const latest = target.metrics[0];
    await transaction.deviceMetric.create({
      data: {
        deviceId: target.id,
        cpuPct: latest?.cpuPct ?? null,
        ramPct: latest?.ramPct ?? null,
        diskPct: null,
        pingMs: latest?.pingMs ?? null,
        packetLossPct: latest?.packetLossPct ?? null,
        downloadMbps: latest?.downloadMbps ?? null,
        uploadMbps: latest?.uploadMbps ?? null,
        uptimeSeconds: null,
        sourceTime,
        receivedAt: sourceTime,
        batchKey,
        source: MetricSource.SIMULATION,
        simulationRunId: run.id,
      },
    });
  }
}

export class PrismaSimulationRepository implements SimulationRepository {
  async start(
    command: StartRunCommand,
    context: DeviceMutationContext,
  ): Promise<SimulationRunRecord> {
    const existingIdempotent = await prisma.simulationRun.findUnique({
      where: { idempotencyKey: command.idempotencyKey },
    });
    if (existingIdempotent) {
      if (!sameStart(existingIdempotent, command)) {
        throw new SimulationError(
          "SIMULATION_IDEMPOTENCY_CONFLICT",
          "The idempotency key was already used for a different request.",
          409,
        );
      }
      return mapRun(existingIdempotent);
    }

    const definition = SCENARIOS[command.scenarioCode];
    if (!definition) {
      throw new SimulationError(
        "SIMULATION_SCENARIO_UNSUPPORTED",
        "The requested simulation scenario is not supported.",
        400,
      );
    }

    const targetIds = [...new Set(command.targetDeviceIds)];
    if (targetIds.length !== command.targetDeviceIds.length) {
      throw new SimulationError(
        "SIMULATION_TARGET_INVALID",
        "Simulation targets must be unique.",
        400,
      );
    }

    const committed = await prisma.$transaction(async (transaction) => {
      for (const targetId of [...targetIds].sort()) {
        await transaction.$queryRaw`
          SELECT 1 AS "acquired"
          FROM (
            SELECT pg_advisory_xact_lock(hashtext(${`securenet:simulation-target:${targetId}`}))
          ) AS "target_lock"
        `;
      }
      const targets = await transaction.device.findMany({
        where: { id: { in: targetIds }, archivedAt: null },
      });
      if (
        targets.length !== targetIds.length ||
        targets.some(
          (target) =>
            target.status === "MAINTENANCE" ||
            !isEligibleDeviceType(definition, target.type),
        )
      ) {
        throw new SimulationError(
          "SIMULATION_TARGET_INVALID",
          "One or more targets are unavailable or invalid for this scenario.",
          400,
        );
      }

      const running = await transaction.simulationRun.findMany({
        where: { status: SimulationStatus.RUNNING },
      });
      const overlaps = running.some((active) =>
        parametersOf(active.parameters).targetDeviceIds.some((id) =>
          targetIds.includes(id),
        ),
      );
      if (overlaps) {
        throw new SimulationError(
          "SIMULATION_ACTIVE_CONFLICT",
          "An active simulation already affects one or more targets.",
          409,
        );
      }

      const startedAt = new Date();
      const created = await transaction.simulationRun.create({
        data: {
          scenarioCode: command.scenarioCode,
          status: SimulationStatus.RUNNING,
          startedById: context.actor.id,
          startedAt,
          idempotencyKey: command.idempotencyKey,
          parameters: {
            seed: command.seed,
            engineVersion: SIMULATION_ENGINE_VERSION,
            targetDeviceIds: targetIds,
            durationSeconds: definition.durationSeconds,
            initialStatuses: Object.fromEntries(
              targets.map((target) => [target.id, target.status]),
            ),
          },
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: context.actor.id,
          action: "simulation.run.started",
          entityType: "SimulationRun",
          entityId: created.id,
          afterData: {
            scenarioCode: created.scenarioCode,
            status: created.status,
            targetDeviceIds: targetIds,
          },
          ipAddress: context.requestIp,
        },
      });
      const event = await transaction.event.create({
        data: {
          simulationRunId: created.id,
          actorUserId: context.actor.id,
          type: EventType.SIMULATION_STARTED,
          severity: AlertSeverity.INFO,
          message: `${context.actor.name} started ${definition.name}.`,
          payload: {
            source: "SIMULATION",
            scenarioCode: command.scenarioCode,
            targetDeviceIds: targetIds,
          },
        },
      });
      return { run: created, eventId: event.id.toString() };
    });

    publishRealtimeSafely({
      eventType: "event.created",
      entityType: "event",
      entityId: committed.eventId,
      payload: { event: { id: committed.eventId } },
    });
    return mapRun(committed.run);
  }

  async getById(id: string): Promise<SimulationRunRecord | null> {
    const run = await prisma.simulationRun.findUnique({ where: { id } });
    return run ? mapRun(run) : null;
  }

  async cancel(
    id: string,
    context: DeviceMutationContext,
  ): Promise<SimulationRunRecord> {
    const committed = await prisma.$transaction(async (transaction) => {
      const current = await transaction.simulationRun.findUnique({
        where: { id },
      });
      if (!current) {
        throw new SimulationError(
          "SIMULATION_RUN_NOT_FOUND",
          "Simulation run was not found.",
          404,
        );
      }
      if (current.status !== SimulationStatus.RUNNING) {
        throw new SimulationError(
          "SIMULATION_RUN_NOT_ACTIVE",
          "Only a running simulation may be cancelled.",
          409,
        );
      }
      const endedAt = new Date();
      const parameters = parametersOf(current.parameters);
      const targets = await transaction.device.findMany({
        where: {
          id: { in: [...parameters.targetDeviceIds] },
          archivedAt: null,
          status: { not: "MAINTENANCE" },
        },
        include: {
          metrics: {
            orderBy: [{ sourceTime: "desc" }, { id: "desc" }],
            take: 1,
          },
        },
      });
      const checkpointBatchKey = deterministicBatchKey(id, 2_147_483_647);
      const statusEventIds: string[] = [];
      const changedDeviceIds: string[] = [];
      for (const target of targets) {
        const generated = generateSimulationMetric({
          metric: metricInput(target, target.metrics[0]),
          scenarioCode: null,
          seed: parameters.seed,
          tickNumber: 2_147_483_647,
          progress: 100,
        });
        const restoredStatus =
          parameters.initialStatuses?.[target.id] ?? generated.status;
        await transaction.deviceMetric.create({
          data: {
            deviceId: target.id,
            cpuPct: restoredStatus === "OFFLINE" ? null : generated.cpuPct,
            ramPct: restoredStatus === "OFFLINE" ? null : generated.ramPct,
            diskPct: null,
            pingMs: restoredStatus === "OFFLINE" ? null : generated.pingMs,
            packetLossPct:
              restoredStatus === "OFFLINE" ? 100 : generated.packetLossPct,
            downloadMbps:
              restoredStatus === "OFFLINE" ? 0 : generated.downloadMbps,
            uploadMbps: restoredStatus === "OFFLINE" ? 0 : generated.uploadMbps,
            uptimeSeconds: null,
            sourceTime: endedAt,
            receivedAt: endedAt,
            batchKey: checkpointBatchKey,
            source: MetricSource.SIMULATION,
            simulationRunId: id,
          },
        });
        if (target.status !== restoredStatus) {
          await transaction.device.update({
            where: { id: target.id },
            data: { status: restoredStatus, lastSeenAt: endedAt },
          });
          const statusEvent = await transaction.event.create({
            data: {
              simulationRunId: id,
              deviceId: target.id,
              type: EventType.DEVICE_STATUS_CHANGED,
              severity: statusSeverity(restoredStatus),
              message: `${target.hostname} changed from ${target.status} to ${restoredStatus}.`,
              payload: {
                source: "SIMULATION",
                previousStatus: target.status,
                currentStatus: restoredStatus,
                reason: "SCENARIO_CANCELLED",
              },
              createdAt: endedAt,
            },
          });
          statusEventIds.push(statusEvent.id.toString());
          changedDeviceIds.push(target.id);
        }
      }
      const updated = await transaction.simulationRun.update({
        where: { id },
        data: {
          status: SimulationStatus.CANCELLED,
          endedAt,
          result: { reason: "ADMIN_CANCELLED" },
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: context.actor.id,
          action: "simulation.run.cancelled",
          entityType: "SimulationRun",
          entityId: id,
          beforeData: { status: current.status, progress: current.progress },
          afterData: { status: updated.status, progress: updated.progress },
          ipAddress: context.requestIp,
        },
      });
      const event = await transaction.event.create({
        data: {
          simulationRunId: id,
          actorUserId: context.actor.id,
          type: EventType.SIMULATION_CANCELLED,
          severity: AlertSeverity.INFO,
          message: `${context.actor.name} cancelled ${current.scenarioCode}.`,
          payload: {
            source: "SIMULATION",
            scenarioCode: current.scenarioCode,
            progress: current.progress,
          },
        },
      });
      return {
        run: updated,
        eventIds: [event.id.toString(), ...statusEventIds],
        changedDeviceIds,
      };
    });
    for (const eventId of committed.eventIds) {
      publishRealtimeSafely({
        eventType: "event.created",
        entityType: "event",
        entityId: eventId,
        payload: { event: { id: eventId } },
      });
    }
    for (const deviceId of committed.changedDeviceIds) {
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
      publishRealtimeSafely({
        eventType: "device.updated",
        entityType: "device",
        entityId: device.id,
        payload: {
          deviceId: device.id,
          status: device.status,
          latestMetrics: device.metrics[0]
            ? {
                sourceTime: device.metrics[0].sourceTime.toISOString(),
              }
            : null,
          lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
        },
      });
    }
    return mapRun(committed.run);
  }

  async listRunning(): Promise<readonly SimulationRunRecord[]> {
    const runs = await prisma.simulationRun.findMany({
      where: { status: SimulationStatus.RUNNING },
      orderBy: { startedAt: "asc" },
    });
    return runs.map(mapRun);
  }

  async failOrphanedRuns(): Promise<readonly SimulationRunRecord[]> {
    const runs = await prisma.simulationRun.findMany({
      where: { status: SimulationStatus.RUNNING },
    });
    const failed: SimulationRun[] = [];
    for (const run of runs) {
      failed.push(
        await prisma.$transaction(async (transaction) => {
          const endedAt = new Date();
          await persistFailureCheckpoint(transaction, run, endedAt);
          const updated = await transaction.simulationRun.update({
            where: { id: run.id },
            data: {
              status: SimulationStatus.FAILED,
              endedAt,
              result: { reason: "WORKER_RESTART_RECOVERY" },
            },
          });
          await transaction.event.create({
            data: {
              simulationRunId: run.id,
              type: EventType.SIMULATION_FAILED,
              severity: AlertSeverity.WARNING,
              message: `${run.scenarioCode} failed during worker restart recovery.`,
              payload: {
                source: "SIMULATION",
                reason: "WORKER_RESTART_RECOVERY",
              },
            },
          });
          return updated;
        }),
      );
    }
    return failed.map(mapRun);
  }

  async failRun(
    runId: string,
    reason: string,
  ): Promise<SimulationRunRecord | null> {
    const failed = await prisma.$transaction(async (transaction) => {
      const current = await transaction.simulationRun.findUnique({
        where: { id: runId },
      });
      if (!current || current.status !== SimulationStatus.RUNNING) return null;
      const endedAt = new Date();
      await persistFailureCheckpoint(transaction, current, endedAt);
      const updated = await transaction.simulationRun.update({
        where: { id: runId },
        data: {
          status: SimulationStatus.FAILED,
          endedAt,
          result: { reason },
        },
      });
      await transaction.event.create({
        data: {
          simulationRunId: runId,
          type: EventType.SIMULATION_FAILED,
          severity: AlertSeverity.WARNING,
          message: `${current.scenarioCode} failed.`,
          payload: { source: "SIMULATION", reason },
        },
      });
      return updated;
    });
    return failed ? mapRun(failed) : null;
  }

  async executeTick(
    runId: string,
    now: Date,
  ): Promise<SimulationTickResult | null> {
    const current = await prisma.simulationRun.findUnique({
      where: { id: runId },
    });
    if (!current || current.status !== SimulationStatus.RUNNING) return null;
    const parameters = parametersOf(current.parameters);
    const progress = calculateProgress(
      current.startedAt,
      now,
      parameters.durationSeconds,
    );
    const tickNumber = Math.max(
      0,
      Math.floor(
        (now.getTime() - current.startedAt.getTime()) / SIMULATION_CYCLE_MS,
      ),
    );
    const batchKey = deterministicBatchKey(runId, tickNumber);

    return prisma.$transaction(async (transaction) => {
      const run = await transaction.simulationRun.findUnique({
        where: { id: runId },
      });
      if (!run || run.status !== SimulationStatus.RUNNING) return null;
      const devices = await transaction.device.findMany({
        where: {
          id: { in: [...parameters.targetDeviceIds] },
          archivedAt: null,
          status: { not: "MAINTENANCE" },
        },
        include: {
          metrics: {
            orderBy: [{ sourceTime: "desc" }, { id: "desc" }],
            take: 1,
          },
        },
      });
      const eventIds: string[] = [];
      const changedDeviceIds: string[] = [];
      const generatedByDevice = devices.map((device) => ({
        device,
        generated: generateSimulationMetric({
          metric: metricInput(device, device.metrics[0]),
          scenarioCode: run.scenarioCode as ScenarioCode,
          seed: parameters.seed,
          tickNumber,
          progress,
        }),
      }));
      const complete = progress >= 100;
      const hasStatusTransition = generatedByDevice.some(
        ({ device, generated }) => device.status !== generated.status,
      );
      const persistMetrics =
        run.lastTickAt === null ||
        tickNumber % (60_000 / SIMULATION_CYCLE_MS) === 0 ||
        hasStatusTransition ||
        complete;

      if (persistMetrics) {
        const duplicate = await transaction.deviceMetric.findFirst({
          where: { batchKey, source: MetricSource.SIMULATION },
          select: { id: true },
        });
        if (duplicate) {
          return {
            duplicate: true,
            run: mapRun(run),
            batchKey,
            changedDeviceIds: [],
            eventIds: [],
          };
        }
      }

      for (const { device, generated } of generatedByDevice) {
        if (persistMetrics) {
          await transaction.deviceMetric.create({
            data: {
              deviceId: device.id,
              cpuPct: generated.status === "OFFLINE" ? null : generated.cpuPct,
              ramPct: generated.status === "OFFLINE" ? null : generated.ramPct,
              diskPct: null,
              pingMs: generated.status === "OFFLINE" ? null : generated.pingMs,
              packetLossPct: generated.packetLossPct,
              downloadMbps: generated.downloadMbps,
              uploadMbps: generated.uploadMbps,
              uptimeSeconds: null,
              sourceTime: now,
              receivedAt: now,
              batchKey,
              source: MetricSource.SIMULATION,
              simulationRunId: runId,
            },
          });
        }

        if (device.status !== generated.status) {
          await transaction.device.update({
            where: { id: device.id },
            data: { status: generated.status, lastSeenAt: now },
          });
          const event = await transaction.event.create({
            data: {
              simulationRunId: runId,
              deviceId: device.id,
              type: EventType.DEVICE_STATUS_CHANGED,
              severity: statusSeverity(generated.status),
              message: `${device.hostname} changed from ${device.status} to ${generated.status}.`,
              payload: {
                source: "SIMULATION",
                previousStatus: device.status,
                currentStatus: generated.status,
              },
              createdAt: now,
            },
          });
          eventIds.push(event.id.toString());
          changedDeviceIds.push(device.id);
        } else if (generated.status !== "OFFLINE") {
          await transaction.device.update({
            where: { id: device.id },
            data: { lastSeenAt: now },
          });
        }
      }

      const updated = await transaction.simulationRun.update({
        where: { id: runId },
        data: {
          progress: complete ? 100 : progress,
          lastTickAt: now,
          ...(complete
            ? {
                status: SimulationStatus.COMPLETED,
                endedAt: now,
                result: { reason: "DURATION_COMPLETE" },
              }
            : {}),
        },
      });
      if (complete) {
        const event = await transaction.event.create({
          data: {
            simulationRunId: runId,
            type: EventType.SIMULATION_COMPLETED,
            severity: AlertSeverity.INFO,
            message: `${run.scenarioCode} completed.`,
            payload: {
              source: "SIMULATION",
              scenarioCode: run.scenarioCode,
              progress: 100,
            },
            createdAt: now,
          },
        });
        eventIds.push(event.id.toString());
      }

      return {
        duplicate: false,
        run: mapRun(updated),
        batchKey: persistMetrics ? batchKey : null,
        changedDeviceIds,
        eventIds,
      };
    });
  }

  async executeBaselineTick(now: Date): Promise<BaselineTickResult> {
    const minuteNumber = Math.floor(now.getTime() / 60_000);
    const batchKey = deterministicBatchKey("securenet-baseline", minuteNumber);
    return prisma.$transaction(async (transaction) => {
      const duplicate = await transaction.deviceMetric.findFirst({
        where: { batchKey, source: MetricSource.SIMULATION },
        select: { id: true },
      });
      if (duplicate) {
        return {
          duplicate: true,
          batchKey,
          changedDeviceIds: [],
          eventIds: [],
        };
      }

      const devices = await transaction.device.findMany({
        where: { archivedAt: null, status: { not: "MAINTENANCE" } },
        include: {
          metrics: {
            orderBy: [{ sourceTime: "desc" }, { id: "desc" }],
            take: 1,
          },
        },
      });
      const changedDeviceIds: string[] = [];
      const eventIds: string[] = [];
      for (const device of devices) {
        const generated = generateSimulationMetric({
          metric: metricInput(device, device.metrics[0]),
          scenarioCode: null,
          seed: minuteNumber,
          tickNumber: minuteNumber,
          progress: 0,
        });
        await transaction.deviceMetric.create({
          data: {
            deviceId: device.id,
            cpuPct: generated.status === "OFFLINE" ? null : generated.cpuPct,
            ramPct: generated.status === "OFFLINE" ? null : generated.ramPct,
            diskPct: null,
            pingMs: generated.status === "OFFLINE" ? null : generated.pingMs,
            packetLossPct:
              generated.status === "OFFLINE" ? 100 : generated.packetLossPct,
            downloadMbps:
              generated.status === "OFFLINE" ? 0 : generated.downloadMbps,
            uploadMbps:
              generated.status === "OFFLINE" ? 0 : generated.uploadMbps,
            uptimeSeconds: null,
            sourceTime: now,
            receivedAt: now,
            batchKey,
            source: MetricSource.SIMULATION,
          },
        });
        if (device.status !== generated.status) {
          await transaction.device.update({
            where: { id: device.id },
            data: { status: generated.status, lastSeenAt: now },
          });
          const event = await transaction.event.create({
            data: {
              deviceId: device.id,
              type: EventType.DEVICE_STATUS_CHANGED,
              severity: statusSeverity(generated.status),
              message: `${device.hostname} changed from ${device.status} to ${generated.status}.`,
              payload: {
                source: "SIMULATION",
                previousStatus: device.status,
                currentStatus: generated.status,
              },
              createdAt: now,
            },
          });
          eventIds.push(event.id.toString());
          changedDeviceIds.push(device.id);
        } else if (generated.status !== "OFFLINE") {
          await transaction.device.update({
            where: { id: device.id },
            data: { lastSeenAt: now },
          });
        }
      }
      return { duplicate: false, batchKey, changedDeviceIds, eventIds };
    });
  }

  async acceptedBatch(
    runId: string,
    batchKey: string,
  ): Promise<AcceptedMetricBatch> {
    const run = await prisma.simulationRun.findUniqueOrThrow({
      where: { id: runId },
    });
    const targetIds = parametersOf(run.parameters).targetDeviceIds;
    const devices = await prisma.device.findMany({
      where: { id: { in: [...targetIds] } },
      include: {
        metrics: {
          where: {
            simulationRunId: runId,
            sourceTime: { lte: run.lastTickAt ?? new Date() },
          },
          orderBy: [{ sourceTime: "desc" }, { id: "desc" }],
          take: 20,
        },
      },
    });
    return {
      batchKey,
      devices: devices.map((device) => ({
        id: device.id,
        hostname: device.hostname,
        status: device.status,
        archived: device.archivedAt !== null,
        samples: [...device.metrics].reverse().map((metric) => ({
          cpuPct: decimal(metric.cpuPct),
          ramPct: decimal(metric.ramPct),
          diskPct: decimal(metric.diskPct),
          pingMs: decimal(metric.pingMs),
          packetLossPct: decimal(metric.packetLossPct),
          status: device.status,
          sourceTime: metric.sourceTime,
          stale: isMetricStale(metric.sourceTime),
        })),
      })),
    };
  }

  async acceptedBaselineBatch(batchKey: string): Promise<AcceptedMetricBatch> {
    const devices = await prisma.device.findMany({
      where: {
        archivedAt: null,
        metrics: {
          some: { batchKey, source: MetricSource.SIMULATION },
        },
      },
      include: {
        metrics: {
          where: { batchKey, source: MetricSource.SIMULATION },
          orderBy: [{ sourceTime: "asc" }, { id: "asc" }],
        },
      },
    });
    return {
      batchKey,
      devices: devices.map((device) => ({
        id: device.id,
        hostname: device.hostname,
        status: device.status,
        archived: false,
        samples: device.metrics.map((metric) => ({
          cpuPct: decimal(metric.cpuPct),
          ramPct: decimal(metric.ramPct),
          diskPct: decimal(metric.diskPct),
          pingMs: decimal(metric.pingMs),
          packetLossPct: decimal(metric.packetLossPct),
          status: device.status,
          sourceTime: metric.sourceTime,
          stale: isMetricStale(metric.sourceTime),
        })),
      })),
    };
  }
}
