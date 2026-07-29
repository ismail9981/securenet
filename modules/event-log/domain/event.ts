import { z } from "zod";

import { alertSeveritySchema } from "@/modules/shared/domain/network";

export const EVENT_TYPES = [
  "ALERT_OPENED",
  "ALERT_RETRIGGERED",
  "ALERT_ACKNOWLEDGED",
  "ALERT_INVESTIGATION_STARTED",
  "ALERT_RESOLVED",
  "DEVICE_CREATED",
  "DEVICE_UPDATED",
  "DEVICE_ARCHIVED",
  "DEVICE_STATUS_CHANGED",
  "SIMULATION_STARTED",
  "SIMULATION_COMPLETED",
  "SIMULATION_CANCELLED",
  "SIMULATION_FAILED",
] as const;

export const eventTypeSchema = z.enum(EVENT_TYPES);

const optionalDate = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .optional();

export const eventListQuerySchema = z
  .object({
    cursor: z.string().max(200).optional(),
    limit: z.number().int().min(1).max(100).default(50),
    deviceId: z.string().uuid().optional(),
    alertId: z.string().uuid().optional(),
    actorUserId: z.string().uuid().optional(),
    types: z.array(eventTypeSchema).max(EVENT_TYPES.length).default([]),
    severities: z.array(alertSeveritySchema).max(3).default([]),
    from: optionalDate,
    to: optionalDate,
    search: z.string().trim().max(200).default(""),
  })
  .refine(({ from, to }) => !from || !to || from.getTime() <= to.getTime(), {
    message: "The from date must be before or equal to the to date.",
    path: ["from"],
  });

export interface EventCursor {
  readonly createdAt: Date;
  readonly id: bigint;
}

export function encodeEventCursor(cursor: EventCursor): string {
  return Buffer.from(
    `${cursor.createdAt.toISOString()}|${cursor.id.toString()}`,
    "utf8",
  ).toString("base64url");
}

export function decodeEventCursor(value: string): EventCursor {
  let decoded: string;
  try {
    decoded = Buffer.from(value, "base64url").toString("utf8");
  } catch {
    throw new Error("Invalid Event cursor.");
  }
  const separator = decoded.lastIndexOf("|");
  const createdAt = new Date(decoded.slice(0, separator));
  const idText = decoded.slice(separator + 1);
  if (
    separator < 1 ||
    Number.isNaN(createdAt.getTime()) ||
    !/^\d+$/.test(idText)
  ) {
    throw new Error("Invalid Event cursor.");
  }
  return { createdAt, id: BigInt(idText) };
}

export type EventType = z.infer<typeof eventTypeSchema>;
export type EventListQuery = z.infer<typeof eventListQuerySchema>;
