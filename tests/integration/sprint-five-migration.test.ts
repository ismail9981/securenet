import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const migrationPath =
  "prisma/migrations/20260727100000_sprint_5_simulation/migration.sql";

describe("Sprint 5 additive migration", () => {
  it("adds simulation traceability without destructive operations", async () => {
    const sql = await readFile(migrationPath, "utf8");
    expect(sql).toContain('CREATE TABLE "simulation_runs"');
    expect(sql).toContain('"simulation_run_id" UUID');
    expect(sql).toContain('"source" "MetricSource"');
    expect(sql).toContain("device_metrics_simulation_device_batch_key");
    expect(sql).toContain("ON DELETE RESTRICT");
    expect(sql).not.toMatch(/\bDROP\s+(TABLE|COLUMN|TYPE)\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
  });
});
