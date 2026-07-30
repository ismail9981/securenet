import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "../generated/prisma/client";
import { logEvent } from "../lib/logger";

config({ path: ".env.local", quiet: true });

function nameFromUrl(value: string): string {
  return decodeURIComponent(new URL(value).pathname.replace(/^\/+/, ""));
}

export function validateIsolatedRestoreTarget(
  restoreUrl: string | undefined,
  expectedName: string | undefined,
  liveUrl: string | undefined,
): string {
  if (!restoreUrl || !expectedName?.trim()) {
    throw new Error("Restore verification target is not fully identified.");
  }
  const name = nameFromUrl(restoreUrl);
  if (
    name !== expectedName ||
    ["securenet_dev", "securenet_test", "postgres"].includes(name) ||
    name.startsWith("template") ||
    (liveUrl && restoreUrl === liveUrl)
  ) {
    throw new Error("Restore verification target is not safely isolated.");
  }
  return name;
}

async function main(): Promise<void> {
  const restoreUrl = process.env.RESTORE_DATABASE_URL;
  validateIsolatedRestoreTarget(
    restoreUrl,
    process.env.RESTORE_EXPECTED_DATABASE_NAME,
    process.env.DATABASE_URL,
  );

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: restoreUrl }),
  });
  try {
    const [devices, metrics, alerts, events, auditLogs, migrations] =
      await Promise.all([
        client.device.count(),
        client.deviceMetric.count(),
        client.alert.count(),
        client.event.count(),
        client.auditLog.count(),
        client.$queryRaw<Array<{ migration_name: string }>>`
          SELECT migration_name
          FROM "_prisma_migrations"
          WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
          ORDER BY finished_at
        `,
      ]);
    logEvent("info", "backup.restore.verified", {
      counts: { devices, metrics, alerts, events, auditLogs },
      appliedMigrationCount: migrations.length,
      isolatedTarget: true,
    });
  } finally {
    await client.$disconnect();
  }
}

if (process.argv[1]?.endsWith("verify-restored-database.ts")) {
  await main();
}
