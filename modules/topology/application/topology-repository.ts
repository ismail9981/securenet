import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import type {
  SaveTopologyPositions,
  TopologySnapshot,
} from "@/modules/topology/domain/topology";

export interface TopologyRepository {
  getActiveSnapshot(): Promise<TopologySnapshot>;
  savePositions(
    input: SaveTopologyPositions,
    context: DeviceMutationContext,
  ): Promise<{ readonly saved: number }>;
}
