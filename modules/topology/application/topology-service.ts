import {
  authorizeActor,
  type ActorContext,
} from "@/modules/identity/application/authorize";
import type { TopologyRepository } from "@/modules/topology/application/topology-repository";
import type { TopologySnapshot } from "@/modules/topology/domain/topology";
import type { SaveTopologyPositions } from "@/modules/topology/domain/topology";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";

export class TopologyService {
  constructor(private readonly repository: TopologyRepository) {}

  async getActiveSnapshot(context: ActorContext): Promise<TopologySnapshot> {
    authorizeActor(context, "VIEW_DEVICES");
    return this.repository.getActiveSnapshot();
  }

  async savePositions(
    input: SaveTopologyPositions,
    context: DeviceMutationContext,
  ): Promise<{ readonly saved: number }> {
    authorizeActor(context, "SAVE_TOPOLOGY_POSITIONS");
    return this.repository.savePositions(input, context);
  }
}
