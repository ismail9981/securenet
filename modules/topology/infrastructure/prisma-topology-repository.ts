import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { TopologyRepository } from "@/modules/topology/application/topology-repository";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import {
  type SaveTopologyPositions,
  topologySnapshotSchema,
  type TopologySnapshot,
} from "@/modules/topology/domain/topology";

export class PrismaTopologyRepository implements TopologyRepository {
  async getActiveSnapshot(): Promise<TopologySnapshot> {
    const [devices, connections, positions] = await prisma.$transaction([
      prisma.device.findMany({
        where: { archivedAt: null },
        select: {
          id: true,
          name: true,
          hostname: true,
          type: true,
          status: true,
        },
        orderBy: [{ hostname: "asc" }, { id: "asc" }],
      }),
      prisma.networkConnection.findMany({
        where: {
          sourceDevice: { archivedAt: null },
          targetDevice: { archivedAt: null },
        },
        orderBy: [{ sourceDeviceId: "asc" }, { targetDeviceId: "asc" }],
        take: 60,
      }),
      prisma.topologyPosition.findMany({
        where: { device: { archivedAt: null } },
        orderBy: { deviceId: "asc" },
        take: 60,
      }),
    ]);

    return topologySnapshotSchema.parse({
      generatedAt: new Date().toISOString(),
      nodes: devices,
      links: connections.map((connection) => ({
        id: connection.id,
        sourceDeviceId: connection.sourceDeviceId,
        targetDeviceId: connection.targetDeviceId,
        connectionType: connection.connectionType,
        label: connection.label,
        bandwidthCapacityMbps:
          connection.bandwidthCapacityMbps === null
            ? null
            : Number(connection.bandwidthCapacityMbps),
        status: connection.status,
      })),
      positions: positions.map((position) => ({
        deviceId: position.deviceId,
        x: Number(position.x),
        y: Number(position.y),
      })),
    });
  }

  async savePositions(
    input: SaveTopologyPositions,
    context: DeviceMutationContext,
  ): Promise<{ readonly saved: number }> {
    return prisma.$transaction(async (transaction) => {
      const ids = input.positions.map((position) => position.deviceId);
      const count = await transaction.device.count({
        where: { id: { in: ids }, archivedAt: null },
      });
      if (count !== ids.length) {
        throw new z.ZodError([
          {
            code: "custom",
            path: ["positions"],
            message: "Positions may reference only active, existing Devices.",
          },
        ]);
      }
      for (const position of input.positions) {
        await transaction.topologyPosition.upsert({
          where: { deviceId: position.deviceId },
          update: {
            x: position.x,
            y: position.y,
            updatedById: context.actor.id,
          },
          create: {
            ...position,
            updatedById: context.actor.id,
          },
        });
      }
      await transaction.auditLog.create({
        data: {
          actorUserId: context.actor.id,
          action: "topology.positions.saved",
          entityType: "TopologyPosition",
          entityId: null,
          afterData: { count: input.positions.length },
          ipAddress: context.requestIp,
        },
      });
      return { saved: input.positions.length };
    });
  }
}
