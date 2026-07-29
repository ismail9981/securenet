export type SimulationErrorCode =
  | "SIMULATION_SCENARIO_UNSUPPORTED"
  | "SIMULATION_TARGET_INVALID"
  | "SIMULATION_TARGET_CONFLICT"
  | "SIMULATION_RUN_NOT_FOUND"
  | "SIMULATION_RUN_NOT_ACTIVE"
  | "SIMULATION_ACTIVE_CONFLICT"
  | "SIMULATION_IDEMPOTENCY_CONFLICT"
  | "SIMULATION_WORKER_UNAVAILABLE"
  | "SIMULATION_INVALID_STATE";

export class SimulationError extends Error {
  constructor(
    readonly code: SimulationErrorCode,
    message: string,
    readonly status: 400 | 404 | 409 | 500,
  ) {
    super(message);
    this.name = "SimulationError";
  }
}
