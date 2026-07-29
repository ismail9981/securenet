import { z } from "zod";

export const REALTIME_EVENT_TYPES = [
  "device.updated",
  "alert.created",
  "alert.updated",
  "event.created",
  "simulation.status",
] as const;

export const realtimeEventTypeSchema = z.enum(REALTIME_EVENT_TYPES);

export const realtimeEnvelopeSchema = z.object({
  version: z.literal(1),
  eventId: z.string().uuid(),
  eventType: realtimeEventTypeSchema,
  timestamp: z.string().datetime(),
  entityType: z.enum(["device", "alert", "event", "simulation"]),
  entityId: z.string().min(1).max(100),
  correlationId: z.string().uuid().nullable(),
  payload: z.record(z.string(), z.unknown()),
});

export type RealtimeEventType = z.infer<typeof realtimeEventTypeSchema>;
export type RealtimeEnvelope = z.infer<typeof realtimeEnvelopeSchema>;

export interface RealtimeEventInput {
  readonly eventType: RealtimeEventType;
  readonly entityType: RealtimeEnvelope["entityType"];
  readonly entityId: string;
  readonly correlationId?: string | null;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly audienceRoles?: readonly import("@/modules/shared/domain/network").UserRole[];
}

export const MAX_REALTIME_MESSAGE_BYTES = 65_536;
export const HEARTBEAT_INTERVAL_MS = 20_000;
export const CONNECTION_IDLE_TIMEOUT_MS = 60_000;
export const RECONNECT_DELAY_MS = 15_000;
export const POLLING_FALLBACK_MS = 5_000;
export const MAX_CONNECTIONS_PER_USER = 3;
export const MAX_DEMO_CONNECTIONS = 50;
