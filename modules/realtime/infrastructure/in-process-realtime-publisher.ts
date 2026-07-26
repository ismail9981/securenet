import { randomUUID } from "node:crypto";

import { logEvent } from "@/lib/logger";
import {
  MAX_DEMO_CONNECTIONS,
  MAX_CONNECTIONS_PER_USER,
  MAX_REALTIME_MESSAGE_BYTES,
  realtimeEnvelopeSchema,
  type RealtimeEnvelope,
  type RealtimeEventInput,
} from "@/modules/realtime/application/realtime-contracts";
import type { RealtimePublisher } from "@/modules/realtime/application/realtime-publisher";

type Subscriber = (envelope: RealtimeEnvelope) => void;

interface SubscriberRecord {
  readonly userId: string;
  readonly subscriber: Subscriber;
}

class InProcessRealtimeHub implements RealtimePublisher {
  private readonly subscribers = new Map<string, SubscriberRecord>();

  canConnect(userId: string): boolean {
    if (this.subscribers.size >= MAX_DEMO_CONNECTIONS) return false;
    let userConnections = 0;
    for (const record of this.subscribers.values()) {
      if (record.userId === userId) userConnections += 1;
    }
    return userConnections < MAX_CONNECTIONS_PER_USER;
  }

  subscribe(userId: string, subscriber: Subscriber): (() => void) | null {
    if (!this.canConnect(userId)) return null;
    const subscriptionId = randomUUID();
    this.subscribers.set(subscriptionId, { userId, subscriber });
    return () => {
      this.subscribers.delete(subscriptionId);
    };
  }

  publish(input: RealtimeEventInput): RealtimeEnvelope {
    const envelope = realtimeEnvelopeSchema.parse({
      version: 1,
      eventId: randomUUID(),
      eventType: input.eventType,
      timestamp: new Date().toISOString(),
      entityType: input.entityType,
      entityId: input.entityId,
      correlationId: input.correlationId ?? null,
      payload: input.payload,
    });
    const bytes = new TextEncoder().encode(JSON.stringify(envelope)).byteLength;
    if (bytes > MAX_REALTIME_MESSAGE_BYTES) {
      throw new Error("Realtime message exceeds the 64 KB Demo limit.");
    }

    for (const { subscriber } of this.subscribers.values()) {
      try {
        subscriber(envelope);
      } catch (error) {
        logEvent("error", "realtime.subscriber.failed", {
          eventId: envelope.eventId,
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      }
    }
    return envelope;
  }

  connectionCount(): number {
    return this.subscribers.size;
  }

  resetForTests(): void {
    this.subscribers.clear();
  }
}

const realtimeProcess = process as NodeJS.Process & {
  secureNetRealtimeHub?: InProcessRealtimeHub;
};

export const realtimeHub =
  realtimeProcess.secureNetRealtimeHub ??
  (realtimeProcess.secureNetRealtimeHub = new InProcessRealtimeHub());

export function publishRealtimeSafely(input: RealtimeEventInput): void {
  try {
    realtimeHub.publish(input);
  } catch (error) {
    logEvent("error", "realtime.publish.failed", {
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }
}
