import type { DeviceMutationContext } from "@/modules/inventory/application/device-repository";
import type {
  SimulationRunRecord,
  StartSimulationInput,
} from "@/modules/simulation/application/simulation-contracts";

export interface StartRunCommand extends StartSimulationInput {
  readonly seed: number;
  readonly idempotencyKey: string;
}

export interface SimulationTickResult {
  readonly duplicate: boolean;
  readonly run: SimulationRunRecord;
  readonly batchKey: string | null;
  readonly changedDeviceIds: readonly string[];
  readonly eventIds: readonly string[];
}

export interface BaselineTickResult {
  readonly duplicate: boolean;
  readonly batchKey: string;
  readonly changedDeviceIds: readonly string[];
  readonly eventIds: readonly string[];
}

export interface SimulationRepository {
  start(
    command: StartRunCommand,
    context: DeviceMutationContext,
  ): Promise<SimulationRunRecord>;
  getById(id: string): Promise<SimulationRunRecord | null>;
  cancel(
    id: string,
    context: DeviceMutationContext,
  ): Promise<SimulationRunRecord>;
  listRunning(): Promise<readonly SimulationRunRecord[]>;
  failOrphanedRuns(): Promise<readonly SimulationRunRecord[]>;
  failRun(runId: string, reason: string): Promise<SimulationRunRecord | null>;
  executeTick(runId: string, now: Date): Promise<SimulationTickResult | null>;
  executeBaselineTick(now: Date): Promise<BaselineTickResult>;
  acceptedBatch(
    runId: string,
    batchKey: string,
  ): Promise<
    import("@/modules/alerting/application/alert-contracts").AcceptedMetricBatch
  >;
  acceptedBaselineBatch(
    batchKey: string,
  ): Promise<
    import("@/modules/alerting/application/alert-contracts").AcceptedMetricBatch
  >;
}
