import { describe, expect, it } from "vitest";

import {
  decodeEventCursor,
  encodeEventCursor,
  eventListQuerySchema,
} from "@/modules/event-log/domain/event";

describe("Event domain boundaries", () => {
  it("round-trips a cursor and rejects malformed cursor values", () => {
    const cursor = {
      createdAt: new Date("2026-07-29T00:00:00Z"),
      id: BigInt(42),
    };
    expect(decodeEventCursor(encodeEventCursor(cursor))).toEqual(cursor);
    expect(() => decodeEventCursor("not-a-cursor")).toThrow();
    expect(() =>
      decodeEventCursor(
        Buffer.from("not-a-date|42", "utf8").toString("base64url"),
      ),
    ).toThrow();
  });

  it("bounds event periods", () => {
    expect(
      eventListQuerySchema.parse({
        from: "2026-07-01T00:00:00Z",
        to: "2026-07-02T00:00:00Z",
      }).limit,
    ).toBe(50);
    expect(() =>
      eventListQuerySchema.parse({
        from: "2026-07-02T00:00:00Z",
        to: "2026-07-01T00:00:00Z",
      }),
    ).toThrow();
    expect(() =>
      eventListQuerySchema.parse({
        from: "2026-06-01T00:00:00Z",
        to: "2026-07-02T00:00:00Z",
      }),
    ).toThrow();
  });
});
