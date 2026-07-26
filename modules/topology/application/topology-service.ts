import {
  authorizeActor,
  type ActorContext,
} from "@/modules/identity/application/authorize";
import type { TopologyRepository } from "@/modules/topology/application/topology-repository";
import type { TopologySnapshot } from "@/modules/topology/domain/topology";

export class TopologyService {
  constructor(private readonly repository: TopologyRepository) {}

  async getActiveSnapshot(context: ActorContext): Promise<TopologySnapshot> {
    authorizeActor(context, "VIEW_DEVICES");
    return this.repository.getActiveSnapshot();
  }
}
