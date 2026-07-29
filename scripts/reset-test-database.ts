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
    await client.$transaction([
      client.topologyPosition.deleteMany(),
      client.systemSetting.deleteMany(),
      client.event.deleteMany(),
      client.auditLog.deleteMany(),
      client.alert.deleteMany(),
      client.alertRule.deleteMany(),
      client.deviceMetric.deleteMany(),
      client.simulationRun.deleteMany(),
      client.networkConnection.deleteMany(),
      client.device.deleteMany(),
      client.location.deleteMany(),
      client.user.deleteMany(),
    ]);
    await seedDatabase(client);
  } finally {
    await client.$disconnect();
  }
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  await resetTestDatabase();
}
