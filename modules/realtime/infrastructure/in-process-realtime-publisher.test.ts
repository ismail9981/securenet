import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  publishRealtimeSafely,
  realtimeHub,
} from "@/modules/realtime/infrastructure/in-process-realtime-publisher";

describe("in-process realtime publisher", () => {
  beforeEach(() => realtimeHub.resetForTests());

  it("publishes a versioned allow-listed envelope with a unique event ID", () => {
    const received = vi.fn();
    const release = realtimeHub.subscribe("user-1", received);
    const first = realtimeHub.publish({
      eventType: "device.updated",
      entityType: "device",
      entityId: "30000000-0000-4000-8000-000000000001",
      payload: { status: "ONLINE" },
    });
    const second = realtimeHub.publish({
      eventType: "device.updated",
      entityType: "device",
      entityId: "30000000-0000-4000-8000-000000000001",
      payload: { status: "ONLINE" },
    });

    expect(first.version).toBe(1);
    expect(first.eventId).not.toBe(second.eventId);
    expect(received).toHaveBeenCalledTimes(2);
    release?.();
  });

  it("enforces three connections per user and 64 KB messages", () => {
    const releases = [1, 2, 3].map(() =>
      realtimeHub.subscribe("same-user", vi.fn()),
    );
    expect(releases.every(Boolean)).toBe(true);
    expect(realtimeHub.subscribe("same-user", vi.fn())).toBeNull();
    expect(() =>
      realtimeHub.publish({
        eventType: "event.created",
        entityType: "event",
        entityId: "1",
        payload: { value: "x".repeat(65_536) },
      }),
    ).toThrow("64 KB");
    releases.forEach((release) => release?.());
  });

  it("enforces 50 total Demo connections", () => {
    const releases = Array.from({ length: 50 }, (_, index) =>
      realtimeHub.subscribe(`user-${index}`, vi.fn()),
    );
    expect(releases.every(Boolean)).toBe(true);
    expect(realtimeHub.subscribe("user-51", vi.fn())).toBeNull();
    releases.forEach((release) => release?.());
  });

  it("delivers simulation status only to Administrator subscribers", () => {
    const admin = vi.fn();
    const engineer = vi.fn();
    realtimeHub.subscribe("admin", "ADMIN", admin);
    realtimeHub.subscribe("engineer", "NETWORK_ENGINEER", engineer);

    realtimeHub.publish({
      eventType: "simulation.status",
      entityType: "simulation",
      entityId: "run-1",
      audienceRoles: ["ADMIN"],
      payload: {
        runId: "run-1",
        scenarioCode: "SIM-CPU-OVERLOAD",
        status: "RUNNING",
        progress: 10,
      },
    });

    expect(admin).toHaveBeenCalledOnce();
    expect(engineer).not.toHaveBeenCalled();
  });

  it("logs publication failure without throwing into the business operation", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      publishRealtimeSafely({
        eventType: "event.created",
        entityType: "event",
        entityId: "1",
        payload: { value: "x".repeat(65_536) },
      }),
    ).not.toThrow();
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining('"event":"realtime.publish.failed"'),
    );
    logged.mockRestore();
  });
});
