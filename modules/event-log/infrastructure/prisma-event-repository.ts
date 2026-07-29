import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  EventPage,
  EventRecord,
} from "@/modules/event-log/application/event-contracts";
import type { EventRepository } from "@/modules/event-log/application/event-repository";
import {
  decodeEventCursor,
  encodeEventCursor,
  type EventListQuery,
} from "@/modules/event-log/domain/event";
import { DeviceNotFoundError } from "@/modules/inventory/application/device-errors";

const eventInclude = {
  device: {
    select: { id: true, name: true, hostname: true, archivedAt: true },
  },
  alert: { select: { id: true, title: true, status: true } },
  actorUser: { select: { id: true, name: true, email: true } },
  simulationRun: {
    select: { id: true, scenarioCode: true, status: true },
  },
} satisfies Prisma.EventInclude;

type EventWithReferences = Prisma.EventGetPayload<{
  include: typeof eventInclude;
}>;

function mapEvent(event: EventWithReferences): EventRecord {
  return {
    id: event.id.toString(),
    type: event.type,
    severity: event.severity,
    message: event.message,
    device: event.device
      ? {
          id: event.device.id,
          name: event.device.name,
          hostname: event.device.hostname,
          archived: event.device.archivedAt !== null,
        }
      : null,
    alert: event.alert,
    actor: event.actorUser,
    simulationRun: event.simulationRun,
    createdAt: event.createdAt.toISOString(),
  };
}

function queryWhere(query: EventListQuery): Prisma.EventWhereInput {
  const cursor = query.cursor ? decodeEventCursor(query.cursor) : null;
  return {
    ...(query.deviceId ? { deviceId: query.deviceId } : {}),
    ...(query.alertId ? { alertId: query.alertId } : {}),
    ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
    ...(query.types.length ? { type: { in: query.types } } : {}),
    ...(query.severities.length ? { severity: { in: query.severities } } : {}),
    ...(query.search
      ? { message: { contains: query.search, mode: "insensitive" } }
      : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
    ...(cursor
      ? {
          OR: [
            { createdAt: { lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { lt: cursor.id } },
          ],
        }
      : {}),
  };
}

export class PrismaEventRepository implements EventRepository {
  async list(query: EventListQuery): Promise<EventPage> {
    const records = await prisma.event.findMany({
      where: queryWhere(query),
      include: eventInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
    });
    const hasNext = records.length > query.limit;
    const page = records.slice(0, query.limit);
    const last = page.at(-1);
    return {
      data: page.map(mapEvent),
      meta: {
        nextCursor:
          hasNext && last
            ? encodeEventCursor({ createdAt: last.createdAt, id: last.id })
            : null,
      },
    };
  }

  async listForDevice(
    deviceId: string,
    query: EventListQuery,
  ): Promise<EventPage> {
    const device = await prisma.device.findFirst({
      where: { id: deviceId, archivedAt: null },
      select: { id: true },
    });
    if (!device) throw new DeviceNotFoundError();
    return this.list({ ...query, deviceId });
  }
}
