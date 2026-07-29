import { randomUUID } from "node:crypto";

import pg from "pg";

import { requireDatabaseUrl } from "@/lib/database-url";
import { logEvent } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { RealtimeEventInput } from "@/modules/realtime/application/realtime-contracts";
import { realtimeHub } from "@/modules/realtime/infrastructure/in-process-realtime-publisher";

const CHANNEL = "securenet_realtime";
const processId = randomUUID();

interface BridgeMessage {
  readonly originProcessId: string;
  readonly input: RealtimeEventInput;
}

const bridgeGlobal = globalThis as typeof globalThis & {
  secureNetRealtimeBridge?: Promise<pg.Client>;
};

function isBridgeMessage(value: unknown): value is BridgeMessage {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<BridgeMessage>;
  return (
    typeof record.originProcessId === "string" &&
    Boolean(record.input) &&
    typeof record.input?.eventType === "string" &&
    typeof record.input?.entityType === "string" &&
    typeof record.input?.entityId === "string"
  );
}

export async function publishCrossProcessRealtime(
  input: RealtimeEventInput,
): Promise<void> {
  const message: BridgeMessage = { originProcessId: processId, input };
  await prisma.$executeRaw`
    SELECT pg_notify(${CHANNEL}, ${JSON.stringify(message)})
  `;
}

export async function ensurePostgresRealtimeBridge(): Promise<void> {
  bridgeGlobal.secureNetRealtimeBridge ??= (async () => {
    const client = new pg.Client({ connectionString: requireDatabaseUrl() });
    await client.connect();
    client.on("notification", (notification) => {
      if (!notification.payload) return;
      try {
        const message = JSON.parse(notification.payload) as unknown;
        if (
          !isBridgeMessage(message) ||
          message.originProcessId === processId
        ) {
          return;
        }
        realtimeHub.publish(message.input);
      } catch (error) {
        logEvent("error", "realtime.bridge.message-rejected", {
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      }
    });
    client.on("error", (error) => {
      logEvent("error", "realtime.bridge.failed", {
        errorName: error.name,
      });
    });
    await client.query(`LISTEN ${CHANNEL}`);
    return client;
  })();
  await bridgeGlobal.secureNetRealtimeBridge;
}
