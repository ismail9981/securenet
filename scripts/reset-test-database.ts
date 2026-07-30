import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { pathToFileURL } from "node:url";

import { PrismaClient } from "../generated/prisma/client";
import { requireTestDatabaseUrl } from "../lib/database-url";
import { seedDatabase } from "../prisma/seed";

config({ path: ".env.local", quiet: true });

export async function resetTestDatabase(): Promise<void> {
  const testDatabaseUrl = requireTestDatabaseUrl();
  process.env.DATABASE_URL = testDatabaseUrl;

  const adapter = new PrismaPg({ connectionString: testDatabaseUrl });
  const client = new PrismaClient({ adapter });

  try {
    await client.$transaction(async (transaction) => {
      await transaction.topologyPosition.deleteMany();
      await transaction.systemSetting.deleteMany();
      await transaction.event.deleteMany();
      await transaction.auditLog.deleteMany();
      await transaction.alert.deleteMany();
      await transaction.alertRule.deleteMany();
      await transaction.deviceMetric.deleteMany();
      await transaction.simulationRun.deleteMany();
      await transaction.networkConnection.deleteMany();
      await transaction.device.deleteMany();
      await transaction.location.deleteMany();
      await transaction.user.deleteMany();
    });
    await seedDatabase(client);
  } finally {
    await client.$disconnect();
  }
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await resetTestDatabase();
}
