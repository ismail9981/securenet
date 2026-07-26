import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const migrationPath =
  "prisma/migrations/20260726210000_sprint_4_topology/migration.sql";

describe("Sprint 4 additive migration", () => {
  it("adds only topology objects and contains required preservation constraints", async () => {
    const sql = await readFile(migrationPath, "utf8");
    expect(sql).toContain('CREATE TABLE "network_connections"');
    expect(sql).toContain("network_connections_no_self_link_check");
    expect(sql).toContain("network_connections_canonical_endpoints_check");
    expect(sql).toContain("network_connections_endpoints_type_key");
    expect(sql).toContain("ON DELETE RESTRICT");
    expect(sql).not.toMatch(/\bDROP\s+(TABLE|COLUMN|TYPE)\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
  });
});
