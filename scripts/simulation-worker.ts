import { config } from "dotenv";
import pg from "pg";

import { requireDatabaseUrl } from "../lib/database-url";
import { logEvent } from "../lib/logger";
import { validateRuntimeEnvironment } from "../lib/runtime-environment";
import { SimulationRuntime } from "../modules/simulation/application/simulation-runtime";
import {
  acquireSimulationWorkerLock,
  releaseSimulationWorkerLock,
} from "../modules/simulation/infrastructure/postgres-worker-lock";
import { simulationRepository } from "../modules/simulation/infrastructure/simulation-service";

config({ path: ".env.local", quiet: true });
validateRuntimeEnvironment();

const client = new pg.Client({ connectionString: requireDatabaseUrl() });
await client.connect();

if (!(await acquireSimulationWorkerLock(client))) {
  logEvent("warn", "simulation.worker.lock-unavailable");
  await client.end();
  process.exitCode = 1;
} else {
  const runtime = new SimulationRuntime(simulationRepository);
  const shutdown = (signal: NodeJS.Signals) => {
    logEvent("info", "simulation.worker.stopping", { signal });
    runtime.stop();
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  logEvent("info", "simulation.worker.started", { instanceCount: 1 });
  try {
    await runtime.run();
  } finally {
    await releaseSimulationWorkerLock(client);
    await client.end();
    logEvent("info", "simulation.worker.stopped");
  }
}
