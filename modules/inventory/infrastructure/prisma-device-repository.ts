import { isIP } from "node:net";

import {
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
    activeAlertCount: null,
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
    const device = await prisma.device.findFirst({
      where: { id, archivedAt: null },
      select: { id: true },
    });
    if (!device) return null;

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
      const id = await prisma.$transaction(async (transaction) => {
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
        return created.id;
      });

      return (await this.getById(id)) as DeviceDetails;
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
      await prisma.$transaction(async (transaction) => {
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
      });

      return (await this.getById(id)) as DeviceDetails;
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

    await prisma.$transaction(async (transaction) => {
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
    });

    return { id, archivedAt: archivedAt.toISOString() };
  }
}
