import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "../generated/prisma/client";
import { requireDatabaseUrl } from "../lib/database-url";
import { logEvent } from "../lib/logger";
import { validatePortfolioBootstrapEnvironment } from "../lib/runtime-environment";
import { seedDatabase } from "../prisma/seed";

config({ path: ".env.local", quiet: true });

export type PortfolioOperationalCounts = Readonly<Record<string, number>>;

export function assertEmptyPortfolioDatabase(
  counts: PortfolioOperationalCounts,
): void {
  const populated = Object.entries(counts).filter(([, count]) => count !== 0);
  if (populated.length > 0) {
    throw new Error(
      "Portfolio bootstrap refused because application data already exists.",
    );
  }
}

async function main(): Promise<void> {
  validatePortfolioBootstrapEnvironment();
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
    transactionOptions: { timeout: 120_000 },
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
    assertEmptyPortfolioDatabase(counts);
    await seedDatabase(client);
    logEvent("info", "portfolio.bootstrap.completed", {
      deterministicDemo: true,
      emptyOnly: true,
      bandwidthAlertRuleEnabled: false,
    });
  } finally {
    await client.$disconnect();
  }
}

if (process.argv[1]?.endsWith("portfolio-bootstrap.ts")) {
  await main();
}
