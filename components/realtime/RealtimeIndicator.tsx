"use client";

import { useRealtime } from "@/components/realtime/RealtimeProvider";

const labels = {
  CONNECTED: "Connected",
  RECONNECTING: "Reconnecting",
  DISCONNECTED: "Disconnected",
  POLLING: "Polling",
} as const;

const colorClasses = {
  CONNECTED: "bg-success",
  RECONNECTING: "bg-warning",
  DISCONNECTED: "bg-danger",
  POLLING: "bg-info",
} as const;

export function RealtimeIndicator() {
  const { state } = useRealtime();
  return (
    <div
      aria-live="polite"
      className="text-muted flex items-center gap-1.5 text-xs"
      title={`Realtime connection: ${labels[state]}`}
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${colorClasses[state]}`}
      />
      {labels[state]}
    </div>
  );
}
