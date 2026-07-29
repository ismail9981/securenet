"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  MAX_REALTIME_MESSAGE_BYTES,
  POLLING_FALLBACK_MS,
  REALTIME_EVENT_TYPES,
  RECONNECT_DELAY_MS,
  realtimeEnvelopeSchema,
  type RealtimeEnvelope,
} from "@/modules/realtime/application/realtime-contracts";

export type RealtimeConnectionState =
  "CONNECTED" | "RECONNECTING" | "DISCONNECTED" | "POLLING";

interface RealtimeContextValue {
  readonly state: RealtimeConnectionState;
  readonly lastEvent: RealtimeEnvelope | null;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  state: "RECONNECTING",
  lastEvent: null,
});

const LIVE_ROUTES = ["/dashboard", "/topology", "/alerts", "/events"] as const;

export function RealtimeProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const [state, setState] = useState<RealtimeConnectionState>("RECONNECTING");
  const [lastEvent, setLastEvent] = useState<RealtimeEnvelope | null>(null);
  const seenEventIds = useRef(new Set<string>());
  const disconnectedOnce = useRef(false);
  const liveRoute = LIVE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollingTimer: ReturnType<typeof setInterval> | null = null;
    let transitionTimer: ReturnType<typeof setTimeout> | null = null;

    const requestSnapshotRecovery = () => {
      if (liveRoute)
        window.dispatchEvent(new Event("securenet:snapshot-recovery"));
    };

    const startPolling = () => {
      if (pollingTimer) return;
      setState("POLLING");
      if (liveRoute) {
        requestSnapshotRecovery();
        pollingTimer = setInterval(
          requestSnapshotRecovery,
          POLLING_FALLBACK_MS,
        );
      }
    };

    if (typeof EventSource === "undefined") {
      startPolling();
      return () => {
        if (pollingTimer) clearInterval(pollingTimer);
      };
    }

    const source = new EventSource("/api/v1/realtime");
    const handleMessage = (event: MessageEvent<string>) => {
      if (
        new TextEncoder().encode(event.data).byteLength >
        MAX_REALTIME_MESSAGE_BYTES
      ) {
        return;
      }
      try {
        const envelope = realtimeEnvelopeSchema.parse(JSON.parse(event.data));
        if (seenEventIds.current.has(envelope.eventId)) return;
        seenEventIds.current.add(envelope.eventId);
        if (seenEventIds.current.size > 1_000) {
          const oldest = seenEventIds.current.values().next().value as
            string | undefined;
          if (oldest) seenEventIds.current.delete(oldest);
        }
        setLastEvent(envelope);
        window.dispatchEvent(
          new CustomEvent("securenet:realtime", { detail: envelope }),
        );
      } catch {
        // Invalid messages are ignored; REST remains authoritative.
      }
    };

    for (const eventType of REALTIME_EVENT_TYPES) {
      source.addEventListener(eventType, handleMessage as EventListener);
    }

    source.onopen = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (transitionTimer) clearTimeout(transitionTimer);
      if (pollingTimer) clearInterval(pollingTimer);
      reconnectTimer = null;
      transitionTimer = null;
      pollingTimer = null;
      if (disconnectedOnce.current) requestSnapshotRecovery();
      setState("CONNECTED");
    };
    source.onerror = () => {
      disconnectedOnce.current = true;
      setState("DISCONNECTED");
      if (transitionTimer) clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => setState("RECONNECTING"), 250);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(startPolling, RECONNECT_DELAY_MS);
    };

    return () => {
      source.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (transitionTimer) clearTimeout(transitionTimer);
      if (pollingTimer) clearInterval(pollingTimer);
    };
  }, [liveRoute]);

  const value = useMemo(() => ({ state, lastEvent }), [lastEvent, state]);
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext);
}
