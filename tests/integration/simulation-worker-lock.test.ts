import { config } from "dotenv";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { requireTestDatabaseUrl } from "@/lib/database-url";
import {
  acquireSimulationWorkerLock,
  releaseSimulationWorkerLock,
} from "@/modules/simulation/infrastructure/postgres-worker-lock";

config({ path: ".env.local", quiet: true });

let first: pg.Client;
let second: pg.Client;

describe("PostgreSQL simulation worker lock", () => {
  beforeAll(async () => {
    const connectionString = requireTestDatabaseUrl();
    first = new pg.Client({ connectionString });
    second = new pg.Client({ connectionString });
    await first.connect();
    await second.connect();
  });

  afterAll(async () => {
    await releaseSimulationWorkerLock(first);
    await first.end();
    await second.end();
  });

  it("permits one worker and rejects a duplicate process", async () => {
    await expect(acquireSimulationWorkerLock(first)).resolves.toBe(true);
    await expect(acquireSimulationWorkerLock(second)).resolves.toBe(false);
    await releaseSimulationWorkerLock(first);
    await expect(acquireSimulationWorkerLock(second)).resolves.toBe(true);
    await releaseSimulationWorkerLock(second);
  });
});
