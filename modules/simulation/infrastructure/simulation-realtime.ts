import { publishRealtimeSafely } from "@/modules/realtime/infrastructure/in-process-realtime-publisher";
import type { SimulationRunRecord } from "@/modules/simulation/application/simulation-contracts";

export function publishSimulationStatus(run: SimulationRunRecord): void {
  publishRealtimeSafely({
    eventType: "simulation.status",
    entityType: "simulation",
    entityId: run.id,
    audienceRoles: ["ADMIN"],
    payload: {
      runId: run.id,
      scenarioCode: run.scenarioCode,
      status: run.status,
      progress: run.progress,
    },
  });
}

export async function publishSimulationStatusCrossProcess(
  run: SimulationRunRecord,
): Promise<void> {
  const { publishCrossProcessRealtime } =
    await import("@/modules/realtime/infrastructure/postgres-realtime-bridge");
  await publishCrossProcessRealtime({
    eventType: "simulation.status",
    entityType: "simulation",
    entityId: run.id,
    audienceRoles: ["ADMIN"],
    payload: {
      runId: run.id,
      scenarioCode: run.scenarioCode,
      status: run.status,
      progress: run.progress,
    },
  });
}
