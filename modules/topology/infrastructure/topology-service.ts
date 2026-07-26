import { TopologyService } from "@/modules/topology/application/topology-service";
import { PrismaTopologyRepository } from "@/modules/topology/infrastructure/prisma-topology-repository";

export const topologyService = new TopologyService(
  new PrismaTopologyRepository(),
);
