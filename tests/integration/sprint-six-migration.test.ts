import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const migrationPath =
  "prisma/migrations/20260729100000_sprint_6_reports_settings_positions/migration.sql";

describe("Sprint 6 additive migration", () => {
  it("adds settings and positions without destructive SQL", async () => {
    const sql = await readFile(migrationPath, "utf8");
    expect(sql).toContain('CREATE TABLE "system_settings"');
    expect(sql).toContain('CREATE TABLE "topology_positions"');
    expect(sql).toContain("ON DELETE RESTRICT");
    expect(sql).not.toMatch(/\bDROP\s+(TABLE|COLUMN|TYPE)\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDELETE\s+FROM\b/i);
  });
});
