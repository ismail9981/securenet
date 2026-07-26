// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  pathname: "/topology",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

import {
  RealtimeProvider,
  useRealtime,
} from "@/components/realtime/RealtimeProvider";

const noop = () => {};

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private readonly listeners = new Map<
    string,
    Array<(event: MessageEvent) => void>
  >();

  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener as (event: MessageEvent) => void);
    this.listeners.set(type, listeners);
  }

  emit(type: string, data: string) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new MessageEvent(type, { data }));
    }
  }

  close() {}
}

function Probe({
  onAccepted = noop,
}: {
  readonly onAccepted?: (eventId: string) => void;
}) {
  const { state, lastEvent } = useRealtime();
  useEffect(() => {
    if (lastEvent) onAccepted(lastEvent.eventId);
  }, [lastEvent, onAccepted]);
  return (
    <>
      <span>{state}</span>
      <span>Event: {lastEvent?.eventId ?? "none"}</span>
    </>
  );
}

const envelope = {
  version: 1,
  eventId: "70000000-0000-4000-8000-000000000001",
  eventType: "device.updated",
  timestamp: "2026-07-26T12:00:00.000Z",
  entityType: "device",
  entityId: "30000000-0000-4000-8000-000000000001",
  correlationId: null,
  payload: { status: "ONLINE" },
};

describe("RealtimeProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeEventSource.instances = [];
    vi.stubGlobal("EventSource", FakeEventSource);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("suppresses duplicate IDs and safely ignores malformed messages", () => {
    const onAccepted = vi.fn();
    render(
      <RealtimeProvider>
        <Probe onAccepted={onAccepted} />
      </RealtimeProvider>,
    );
    const source = FakeEventSource.instances[0]!;
    act(() => source.onopen?.());
    expect(screen.getByText("CONNECTED")).toBeVisible();

    act(() => {
      source.emit("device.updated", JSON.stringify(envelope));
    });
    expect(screen.getByText(`Event: ${envelope.eventId}`)).toBeVisible();
    const callsAfterAcceptedEvent = onAccepted.mock.calls.length;
    act(() => {
      source.emit("device.updated", JSON.stringify(envelope));
      source.emit("device.updated", "{malformed");
    });
    expect(onAccepted).toHaveBeenCalledTimes(callsAfterAcceptedEvent);
  });

  it("shows recovery states, polls after 15 seconds, and refreshes after reconnect", () => {
    const recover = vi.fn();
    window.addEventListener("securenet:snapshot-recovery", recover);
    render(
      <RealtimeProvider>
        <Probe />
      </RealtimeProvider>,
    );
    const source = FakeEventSource.instances[0]!;
    act(() => source.onopen?.());
    act(() => source.onerror?.());
    expect(screen.getByText("DISCONNECTED")).toBeVisible();
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByText("RECONNECTING")).toBeVisible();
    act(() => vi.advanceTimersByTime(14_750));
    expect(screen.getByText("POLLING")).toBeVisible();
    act(() => vi.advanceTimersByTime(5_000));
    expect(recover).toHaveBeenCalled();
    const callsBeforeReconnect = recover.mock.calls.length;
    act(() => source.onopen?.());
    expect(screen.getByText("CONNECTED")).toBeVisible();
    expect(recover.mock.calls.length).toBeGreaterThan(callsBeforeReconnect);
    window.removeEventListener("securenet:snapshot-recovery", recover);
  });
});
