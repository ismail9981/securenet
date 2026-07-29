import { z } from "zod";

import {
  decodeEventCursor,
  eventListQuerySchema,
} from "@/modules/event-log/domain/event";

function arrayValues(searchParams: URLSearchParams, name: string): string[] {
  return searchParams
    .getAll(name)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseEventListQuery(searchParams: URLSearchParams) {
  const result = eventListQuerySchema.parse({
    cursor: searchParams.get("cursor") || undefined,
    limit: Number(searchParams.get("limit") ?? "50"),
    deviceId: searchParams.get("deviceId") || undefined,
    alertId: searchParams.get("alertId") || undefined,
    actorUserId: searchParams.get("actorUserId") || undefined,
    types: arrayValues(searchParams, "type"),
    severities: arrayValues(searchParams, "severity"),
    alertStatus: searchParams.get("alertStatus") || undefined,
    deviceStatus: searchParams.get("deviceStatus") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    search: searchParams.get("search") ?? undefined,
  });
  if (result.cursor) {
    try {
      decodeEventCursor(result.cursor);
    } catch {
      throw new z.ZodError([
        {
          code: "custom",
          path: ["cursor"],
          message: "The Event cursor is invalid.",
        },
      ]);
    }
  }
  return result;
}
