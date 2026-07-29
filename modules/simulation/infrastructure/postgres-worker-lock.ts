import type pg from "pg";

export const SIMULATION_WORKER_LOCK_KEY = 1_395_289_429;

export async function acquireSimulationWorkerLock(
  client: pg.Client,
): Promise<boolean> {
  const result = await client.query<{ acquired: boolean }>(
    "SELECT pg_try_advisory_lock($1) AS acquired",
    [SIMULATION_WORKER_LOCK_KEY],
  );
  return result.rows[0]?.acquired ?? false;
}

export async function releaseSimulationWorkerLock(
  client: pg.Client,
): Promise<void> {
  await client.query("SELECT pg_advisory_unlock($1)", [
    SIMULATION_WORKER_LOCK_KEY,
  ]);
}
