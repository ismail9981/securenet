import type { TopologySnapshot } from "@/modules/topology/domain/topology";

export interface TopologyRepository {
  getActiveSnapshot(): Promise<TopologySnapshot>;
}
