import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "../generated/prisma/client";
import { requireDatabaseUrl } from "../lib/database-url";
import { logEvent } from "../lib/logger";
import { validateProductionBootstrapEnvironment } from "../lib/runtime-environment";
import { seedDatabase } from "../prisma/seed";

config({ path: ".env.local", quiet: true });

export type OperationalCounts = Readonly<Record<string, number>>;

export function assertEmptyProductionDatabase(counts: OperationalCounts): void {
  const populated = Object.entries(counts).filter(([, count]) => count !== 0);
  if (populated.length > 0) {
    throw new Error(
      "Production Demo bootstrap refused because operational data exists.",
    );
  }
}

async function main(): Promise<void> {
  validateProductionBootstrapEnvironment();
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
  });

  try {
    const counts = {
      users: await client.user.count(),
      locations: await client.location.count(),
      devices: await client.device.count(),
      metrics: await client.deviceMetric.count(),
      alertRules: await client.alertRule.count(),
      alerts: await client.alert.count(),
      events: await client.event.count(),
      auditLogs: await client.auditLog.count(),
      connections: await client.networkConnection.count(),
      simulationRuns: await client.simulationRun.count(),
      settings: await client.systemSetting.count(),
      topologyPositions: await client.topologyPosition.count(),
    };
    assertEmptyProductionDatabase(counts);
    await seedDatabase(client);
    logEvent("info", "production.bootstrap.completed", {
      deterministicDemo: true,
      emptyOnly: true,
    });
  } finally {
    await client.$disconnect();
  }
}

if (process.argv[1]?.endsWith("production-bootstrap.ts")) {
  await main();
}
