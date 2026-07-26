import { prisma } from "@/lib/prisma";
import type { TopologyRepository } from "@/modules/topology/application/topology-repository";
import {
  topologySnapshotSchema,
  type TopologySnapshot,
} from "@/modules/topology/domain/topology";

export class PrismaTopologyRepository implements TopologyRepository {
  async getActiveSnapshot(): Promise<TopologySnapshot> {
    const [devices, connections] = await prisma.$transaction([
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
    });
  }
}
