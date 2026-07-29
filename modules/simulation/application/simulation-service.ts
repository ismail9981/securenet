import { randomInt } from "node:crypto";

import { authorizeActor } from "@/modules/identity/application/authorize";
import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import type {
  SimulationRunRecord,
  StartSimulationInput,
} from "@/modules/simulation/application/simulation-contracts";
import type { SimulationRepository } from "@/modules/simulation/application/simulation-repository";

export class SimulationService {
  constructor(private readonly repository: SimulationRepository) {}

  async start(
    input: StartSimulationInput,
    idempotencyKey: string,
    context: DeviceMutationContext,
  ): Promise<SimulationRunRecord> {
    authorizeActor(context, "RUN_SIMULATION");
    return this.repository.start(
      {
        ...input,
        seed: input.seed ?? randomInt(0, 4_294_967_296),
        idempotencyKey,
      },
      context,
    );
  }

  async getById(
    id: string,
    context: DeviceMutationContext,
  ): Promise<SimulationRunRecord | null> {
    authorizeActor(context, "RUN_SIMULATION");
    return this.repository.getById(id);
  }

  async cancel(
    id: string,
    context: DeviceMutationContext,
  ): Promise<SimulationRunRecord> {
    authorizeActor(context, "RUN_SIMULATION");
    return this.repository.cancel(id, context);
  }
}
