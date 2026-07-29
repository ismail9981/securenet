import { isIP } from "node:net";

import {
  AlertSeverity,
  EventType,
  Prisma,
  type Device as PrismaDevice,
  type DeviceMetric as PrismaDeviceMetric,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  DeviceDetails,
  DevicePage,
  DeviceSummary,
  LocationOption,
  MetricPage,
  MetricSnapshot,
} from "@/modules/inventory/application/device-contracts";
import {
  DeviceConflictError,
  DeviceNotFoundError,
  DeviceReferenceError,
} from "@/modules/inventory/application/device-errors";
import type {
  DeviceMutationContext,
  DeviceRepository,
} from "@/modules/inventory/application/device-repository";
import type {
  CreateDeviceInput,
  DeviceListQuery,
  MetricCursorQuery,
  UpdateDeviceInput,
} from "@/modules/inventory/domain/device";
import { publishRealtimeSafely } from "@/modules/realtime/infrastructure/in-process-realtime-publisher";
import { isMetricStale } from "@/modules/telemetry/domain/freshness";

const deviceInclude = {
  location: true,
  parentDevice: {
    select: { id: true, name: true, hostname: true },
  },
  metrics: {
    orderBy: [{ sourceTime: "desc" }, { id: "desc" }],
    take: 1,
  },
  alerts: {
    where: {
      status: { in: ["OPEN", "ACKNOWLEDGED", "INVESTIGATING"] },
    },
    select: { id: true },
  },
} satisfies Prisma.DeviceInclude;

type DeviceRecord = Prisma.DeviceGetPayload<{ include: typeof deviceInclude }>;

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

function mapMetric(metric: PrismaDeviceMetric): MetricSnapshot {
  return {
    id: metric.id.toString(),
    cpuPct: decimalToNumber(metric.cpuPct),
    ramPct: decimalToNumber(metric.ramPct),
    diskPct: decimalToNumber(metric.diskPct),
    pingMs: decimalToNumber(metric.pingMs),
    packetLossPct: decimalToNumber(metric.packetLossPct),
    downloadMbps: decimalToNumber(metric.downloadMbps),
    uploadMbps: decimalToNumber(metric.uploadMbps),
    uptimeSeconds:
      metric.uptimeSeconds === null ? null : Number(metric.uptimeSeconds),
    source: metric.source,
    simulationRunId: metric.simulationRunId,
    sourceTime: metric.sourceTime.toISOString(),
    receivedAt: metric.receivedAt.toISOString(),
    stale: isMetricStale(metric.sourceTime),
  };
}

function mapSummary(device: DeviceRecord): DeviceSummary {
  return {
    id: device.id,
    name: device.name,
    hostname: device.hostname,
    type: device.type,
    ipAddress: device.ipAddress,
    status: device.status,
    location: {
      id: device.location.id,
      name: device.location.name,
    },
    latestMetrics: device.metrics[0] ? mapMetric(device.metrics[0]) : null,
    lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
    activeAlertCount: device.alerts.length,
  };
}

function mapDetails(device: DeviceRecord): DeviceDetails {
  return {
    ...mapSummary(device),
    macAddress: device.macAddress,
    osName: device.osName,
    importanceWeight: device.importanceWeight,
    parentDevice: device.parentDevice,
    createdAt: device.createdAt.toISOString(),
    updatedAt: device.updatedAt.toISOString(),
  };
}

function sortableValue(
  device: DeviceSummary,
  sort: DeviceListQuery["sort"],
): string | number | null {
  switch (sort) {
    case "name":
      return device.name.toLocaleLowerCase();
    case "status":
      return device.status;
    case "ping":
      return device.latestMetrics?.pingMs ?? null;
    case "lastSeen":
      return device.lastSeenAt;
  }
}

function compareDevices(
  left: DeviceSummary,
  right: DeviceSummary,
  query: DeviceListQuery,
): number {
  const leftValue = sortableValue(left, query.sort);
  const rightValue = sortableValue(right, query.sort);

  if (leftValue === null && rightValue !== null) return 1;
  if (leftValue !== null && rightValue === null) return -1;
  if (leftValue !== null && rightValue !== null) {
    const result =
      typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));

    if (result !== 0) {
      return query.order === "asc" ? result : -result;
    }
  }

  return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
}

function auditSnapshot(device: PrismaDevice): Prisma.InputJsonObject {
  return {
    id: device.id,
    name: device.name,
    hostname: device.hostname,
    ipAddress: device.ipAddress,
    macAddress: device.macAddress,
    type: device.type,
    status: device.status,
    osName: device.osName,
    locationId: device.locationId,
    parentDeviceId: device.parentDeviceId,
    importanceWeight: device.importanceWeight,
    lastSeenAt: device.lastSeenAt?.toISOString() ?? null,
    archivedAt: device.archivedAt?.toISOString() ?? null,
    updatedAt: device.updatedAt.toISOString(),
  };
}

async function assertReferences(
  transaction: Prisma.TransactionClient,
  locationId: string,
  parentDeviceId: string | null | undefined,
  deviceId?: string,
): Promise<void> {
  const location = await transaction.location.findUnique({
    where: { id: locationId },
    select: { id: true },
  });
  if (!location) {
    throw new DeviceReferenceError(
      "Select an existing location.",
      "locationId",
    );
  }

  if (!parentDeviceId) return;
  if (parentDeviceId === deviceId) {
    throw new DeviceConflictError(
      "DEVICE_PARENT_CONFLICT",
      "A device cannot be its own parent.",
      "parentDeviceId",
    );
  }

  const parent = await transaction.device.findFirst({
    where: { id: parentDeviceId, archivedAt: null },
    select: { id: true },
  });
  if (!parent) {
    throw new DeviceReferenceError(
      "Select an active parent device.",
      "parentDeviceId",
    );
  }
}

async function assertUniqueIdentity(
  transaction: Prisma.TransactionClient,
  hostname: string,
  ipAddress: string,
  excludeId?: string,
): Promise<void> {
  const existingHostname = await transaction.device.findFirst({
    where: {
      archivedAt: null,
      hostname: { equals: hostname, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existingHostname) {
    throw new DeviceConflictError(
      "DEVICE_HOSTNAME_CONFLICT",
      "An active device already uses this hostname.",
      "hostname",
    );
  }

  const existingIp = await transaction.device.findFirst({
    where: {
      archivedAt: null,
      ipAddress,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existingIp) {
    throw new DeviceConflictError(
      "DEVICE_IP_CONFLICT",
      "An active device already uses this IP address.",
      "ipAddress",
    );
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function resolveIdentityConflict(
  hostname: string,
  ipAddress: string,
  excludeId?: string,
): Promise<never> {
  const existing = await prisma.device.findFirst({
    where: {
      archivedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [
        { hostname: { equals: hostname, mode: "insensitive" } },
        { ipAddress },
      ],
    },
    select: { hostname: true, ipAddress: true },
  });

  if (existing?.hostname.toLowerCase() === hostname.toLowerCase()) {
    throw new DeviceConflictError(
      "DEVICE_HOSTNAME_CONFLICT",
      "An active device already uses this hostname.",
      "hostname",
    );
  }
  if (existing?.ipAddress === ipAddress) {
    throw new DeviceConflictError(
      "DEVICE_IP_CONFLICT",
      "An active device already uses this IP address.",
      "ipAddress",
    );
  }

  throw new DeviceConflictError(
    "DEVICE_HOSTNAME_CONFLICT",
    "An active device already uses this hostname.",
    "hostname",
  );
}

export class PrismaDeviceRepository implements DeviceRepository {
  async list(query: DeviceListQuery): Promise<DevicePage> {
    const searchIsIp = isIP(query.search) > 0;
    const where: Prisma.DeviceWhereInput = {
      archivedAt: null,
      ...(query.statuses.length ? { status: { in: query.statuses } } : {}),
      ...(query.types.length ? { type: { in: query.types } } : {}),
      ...(query.locationId ? { locationId: query.locationId } : {}),
      ...(query.search
        ? searchIsIp
          ? { ipAddress: query.search }
          : {
              OR: [
                {
                  name: { contains: query.search, mode: "insensitive" },
                },
                {
                  hostname: { contains: query.search, mode: "insensitive" },
                },
              ],
            }
        : {}),
    };

    const records = await prisma.device.findMany({
      where,
      include: deviceInclude,
    });
    const sorted = records
      .map(mapSummary)
      .sort((left, right) => compareDevices(left, right, query));
    const start = (query.page - 1) * query.pageSize;

    return {
      data: sorted.slice(start, start + query.pageSize),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: sorted.length,
        totalPages: Math.max(1, Math.ceil(sorted.length / query.pageSize)),
      },
    };
  }

  async listLocations(): Promise<readonly LocationOption[]> {
    return prisma.location.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  async getById(id: string): Promise<DeviceDetails | null> {
    const device = await prisma.device.findFirst({
      where: { id, archivedAt: null },
      include: deviceInclude,
    });
    return device ? mapDetails(device) : null;
  }

  async getMetrics(
    id: string,
    query: MetricCursorQuery,
  ): Promise<MetricPage | null> {
    const device = await prisma.device.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!device) return null;

    if (query.range || (query.from && query.to)) {
      const duration = {
        "1h": 60 * 60 * 1_000,
        "6h": 6 * 60 * 60 * 1_000,
        "24h": 24 * 60 * 60 * 1_000,
        "7d": 7 * 24 * 60 * 60 * 1_000,
        "30d": 30 * 24 * 60 * 60 * 1_000,
      } as const;
      const bucketSize = {
        "1h": 0,
        "6h": 5 * 60 * 1_000,
        "24h": 15 * 60 * 1_000,
        "7d": 60 * 60 * 1_000,
        "30d": 6 * 60 * 60 * 1_000,
      } as const;
      const range = query.range ?? "custom";
      const to = query.to ? new Date(query.to) : new Date();
      const from = query.from
        ? new Date(query.from)
        : new Date(to.getTime() - duration[query.range ?? "24h"]);
      const interval =
        range === "custom"
          ? Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 500))
          : bucketSize[range];
      if (interval === 0) {
        const source = await prisma.deviceMetric.findMany({
          where: { deviceId: id, sourceTime: { gte: from, lte: to } },
          orderBy: [{ sourceTime: "desc" }, { id: "desc" }],
          take: 500,
        });
        return {
          data: source.reverse().map(mapMetric),
          meta: { nextCursor: null, range, aggregated: false },
        };
      }
      interface AggregateMetric {
        id: string;
        bucketTime: Date;
        lastSourceTime: Date;
        receivedAt: Date;
        cpuPct: Prisma.Decimal | null;
        ramPct: Prisma.Decimal | null;
        diskPct: Prisma.Decimal | null;
        pingMs: Prisma.Decimal | null;
        packetLossPct: Prisma.Decimal | null;
        downloadMbps: Prisma.Decimal | null;
        uploadMbps: Prisma.Decimal | null;
      }
      const intervalSeconds = Math.max(1, Math.ceil(interval / 1_000));
      const aggregated = await prisma.$queryRaw<AggregateMetric[]>(Prisma.sql`
        SELECT
          MAX("id")::text AS "id",
          date_bin(
            make_interval(secs => ${intervalSeconds}),
            "source_time",
            ${from}
          ) AS "bucketTime",
          MAX("source_time") AS "lastSourceTime",
          MAX("received_at") AS "receivedAt",
          AVG("cpu_pct") AS "cpuPct",
          AVG("ram_pct") AS "ramPct",
          AVG("disk_pct") AS "diskPct",
          AVG("ping_ms") AS "pingMs",
          AVG("packet_loss_pct") AS "packetLossPct",
          AVG("download_mbps") AS "downloadMbps",
          AVG("upload_mbps") AS "uploadMbps"
        FROM "device_metrics"
        WHERE "device_id" = ${id}::uuid
          AND "source_time" >= ${from}
          AND "source_time" <= ${to}
        GROUP BY "bucketTime"
        ORDER BY "bucketTime" ASC
        LIMIT 500
      `);
      const number = (value: Prisma.Decimal | null) =>
        value === null ? null : value.toNumber();
      const data: MetricSnapshot[] = aggregated.map((metric) => ({
        id: metric.id,
        sourceTime: metric.bucketTime.toISOString(),
        receivedAt: metric.receivedAt.toISOString(),
        cpuPct: number(metric.cpuPct),
        ramPct: number(metric.ramPct),
        diskPct: number(metric.diskPct),
        pingMs: number(metric.pingMs),
        packetLossPct: number(metric.packetLossPct),
        downloadMbps: number(metric.downloadMbps),
        uploadMbps: number(metric.uploadMbps),
        uptimeSeconds: null,
        source: "AGGREGATED",
        simulationRunId: null,
        stale: isMetricStale(metric.lastSourceTime),
      }));
      return {
        data,
        meta: { nextCursor: null, range, aggregated: true },
      };
    }

    const metrics = await prisma.deviceMetric.findMany({
      where: {
        deviceId: id,
        ...(query.cursor ? { id: { lt: BigInt(query.cursor) } } : {}),
      },
      orderBy: { id: "desc" },
      take: query.limit + 1,
    });
    const hasNext = metrics.length > query.limit;
    const page = metrics.slice(0, query.limit);

    return {
      data: page.map(mapMetric),
      meta: {
        nextCursor: hasNext ? (page.at(-1)?.id.toString() ?? null) : null,
      },
    };
  }

  async create(
    input: CreateDeviceInput,
    context: DeviceMutationContext,
  ): Promise<DeviceDetails> {
    try {
      const committed = await prisma.$transaction(async (transaction) => {
        await assertReferences(
          transaction,
          input.locationId,
          input.parentDeviceId,
        );
        await assertUniqueIdentity(
          transaction,
          input.hostname,
          input.ipAddress,
        );

        const created = await transaction.device.create({
          data: {
            ...input,
            metadata: { source: "DEMO_USER_ENTRY" },
          },
        });
        await transaction.auditLog.create({
          data: {
            actorUserId: context.actor.id,
            action: "device.created",
            entityType: "Device",
            entityId: created.id,
            afterData: auditSnapshot(created),
            ipAddress: context.requestIp,
          },
        });
        const event = await transaction.event.create({
          data: {
            actorUserId: context.actor.id,
            deviceId: created.id,
            type: EventType.DEVICE_CREATED,
            severity: AlertSeverity.INFO,
            message: `${context.actor.name} created ${created.name} (${created.hostname}).`,
            payload: { source: "USER_ACTION" },
          },
        });
        return { id: created.id, eventId: event.id.toString() };
      });

      const device = (await this.getById(committed.id)) as DeviceDetails;
      publishRealtimeSafely({
        eventType: "device.updated",
        entityType: "device",
        entityId: device.id,
        payload: {
          deviceId: device.id,
          status: device.status,
          latestMetrics: device.latestMetrics,
          lastSeenAt: device.lastSeenAt,
        },
      });
      publishRealtimeSafely({
        eventType: "event.created",
        entityType: "event",
        entityId: committed.eventId,
        payload: { event: { id: committed.eventId } },
      });
      return device;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return resolveIdentityConflict(input.hostname, input.ipAddress);
      }
      throw error;
    }
  }

  async update(
    id: string,
    input: UpdateDeviceInput,
    context: DeviceMutationContext,
  ): Promise<DeviceDetails> {
    try {
      const committed = await prisma.$transaction(async (transaction) => {
        const existing = await transaction.device.findFirst({
          where: { id, archivedAt: null },
        });
        if (!existing) throw new DeviceNotFoundError();

        const locationId = input.locationId ?? existing.locationId;
        const parentDeviceId =
          input.parentDeviceId === undefined
            ? existing.parentDeviceId
            : input.parentDeviceId;
        const hostname = input.hostname ?? existing.hostname;
        const ipAddress = input.ipAddress ?? existing.ipAddress;

        await assertReferences(
          transaction,
          locationId,
          parentDeviceId,
          existing.id,
        );
        await assertUniqueIdentity(
          transaction,
          hostname,
          ipAddress,
          existing.id,
        );

        const updated = await transaction.device.update({
          where: { id },
          data: {
            ...(input.name === undefined ? {} : { name: input.name }),
            ...(input.hostname === undefined
              ? {}
              : { hostname: input.hostname }),
            ...(input.ipAddress === undefined
              ? {}
              : { ipAddress: input.ipAddress }),
            ...(input.macAddress === undefined
              ? {}
              : { macAddress: input.macAddress }),
            ...(input.type === undefined ? {} : { type: input.type }),
            ...(input.status === undefined ? {} : { status: input.status }),
            ...(input.osName === undefined ? {} : { osName: input.osName }),
            ...(input.locationId === undefined
              ? {}
              : { locationId: input.locationId }),
            ...(input.parentDeviceId === undefined
              ? {}
              : { parentDeviceId: input.parentDeviceId }),
            ...(input.importanceWeight === undefined
              ? {}
              : { importanceWeight: input.importanceWeight }),
          },
        });
        await transaction.auditLog.create({
          data: {
            actorUserId: context.actor.id,
            action: "device.updated",
            entityType: "Device",
            entityId: id,
            beforeData: auditSnapshot(existing),
            afterData: auditSnapshot(updated),
            ipAddress: context.requestIp,
          },
        });
        const updatedEvent = await transaction.event.create({
          data: {
            actorUserId: context.actor.id,
            deviceId: updated.id,
            type: EventType.DEVICE_UPDATED,
            severity: AlertSeverity.INFO,
            message: `${context.actor.name} updated ${updated.name} (${updated.hostname}).`,
            payload: { source: "USER_ACTION" },
          },
        });
        let statusEventId: string | null = null;
        if (existing.status !== updated.status) {
          const statusEvent = await transaction.event.create({
            data: {
              actorUserId: context.actor.id,
              deviceId: updated.id,
              type: EventType.DEVICE_STATUS_CHANGED,
              severity:
                updated.status === "OFFLINE"
                  ? AlertSeverity.CRITICAL
                  : updated.status === "DEGRADED"
                    ? AlertSeverity.WARNING
                    : AlertSeverity.INFO,
              message: `${updated.hostname} changed from ${existing.status} to ${updated.status}.`,
              payload: {
                source: "USER_ACTION",
                previousStatus: existing.status,
                currentStatus: updated.status,
              },
            },
          });
          statusEventId = statusEvent.id.toString();
        }
        return {
          eventIds: [updatedEvent.id.toString(), statusEventId].filter(
            (eventId): eventId is string => eventId !== null,
          ),
        };
      });

      const device = (await this.getById(id)) as DeviceDetails;
      publishRealtimeSafely({
        eventType: "device.updated",
        entityType: "device",
        entityId: device.id,
        payload: {
          deviceId: device.id,
          status: device.status,
          latestMetrics: device.latestMetrics,
          lastSeenAt: device.lastSeenAt,
        },
      });
      for (const eventId of committed.eventIds) {
        publishRealtimeSafely({
          eventType: "event.created",
          entityType: "event",
          entityId: eventId,
          payload: { event: { id: eventId } },
        });
      }
      return device;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const existing = await prisma.device.findUnique({
          where: { id },
          select: { hostname: true, ipAddress: true },
        });
        return resolveIdentityConflict(
          input.hostname ?? existing?.hostname ?? "",
          input.ipAddress ?? existing?.ipAddress ?? "",
          id,
        );
      }
      throw error;
    }
  }

  async archive(
    id: string,
    context: DeviceMutationContext,
  ): Promise<{ readonly id: string; readonly archivedAt: string }> {
    const archivedAt = new Date();

    const committed = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.device.findFirst({
        where: { id, archivedAt: null },
      });
      if (!existing) throw new DeviceNotFoundError();

      const archived = await transaction.device.update({
        where: { id },
        data: { archivedAt },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: context.actor.id,
          action: "device.archived",
          entityType: "Device",
          entityId: id,
          beforeData: auditSnapshot(existing),
          afterData: auditSnapshot(archived),
          ipAddress: context.requestIp,
        },
      });
      const event = await transaction.event.create({
        data: {
          actorUserId: context.actor.id,
          deviceId: archived.id,
          type: EventType.DEVICE_ARCHIVED,
          severity: AlertSeverity.INFO,
          message: `${context.actor.name} archived ${archived.name} (${archived.hostname}).`,
          payload: { source: "USER_ACTION" },
        },
      });
      return {
        eventId: event.id.toString(),
        status: archived.status,
        lastSeenAt: archived.lastSeenAt?.toISOString() ?? null,
      };
    });

    publishRealtimeSafely({
      eventType: "device.updated",
      entityType: "device",
      entityId: id,
      payload: {
        deviceId: id,
        status: committed.status,
        latestMetrics: null,
        lastSeenAt: committed.lastSeenAt,
      },
    });
    publishRealtimeSafely({
      eventType: "event.created",
      entityType: "event",
      entityId: committed.eventId,
      payload: { event: { id: committed.eventId } },
    });
    return { id, archivedAt: archivedAt.toISOString() };
  }
}
