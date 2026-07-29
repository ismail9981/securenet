"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { EventPage } from "@/modules/event-log/application/event-contracts";
import { formatDateTime } from "@/modules/inventory/presentation/device-format";
import type { RealtimeEnvelope } from "@/modules/realtime/application/realtime-contracts";

export function EventTimeline({
  page: initialPage,
  refreshUrl,
}: {
  readonly page: EventPage;
  readonly refreshUrl?: string;
}) {
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    if (!refreshUrl) return;
    let cancelled = false;
    const refresh = (event?: Event) => {
      const envelope = (event as CustomEvent<RealtimeEnvelope> | undefined)
        ?.detail;
      if (envelope && envelope.eventType !== "event.created") return;
      void fetch(refreshUrl, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Event refresh failed.");
          return (await response.json()) as EventPage;
        })
        .then((nextPage) => {
          if (!cancelled) setPage(nextPage);
        })
        .catch(() => {
          // Reconnect recovery and conditional polling remain available.
        });
    };
    window.addEventListener("securenet:realtime", refresh);
    window.addEventListener("securenet:snapshot-recovery", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("securenet:realtime", refresh);
      window.removeEventListener("securenet:snapshot-recovery", refresh);
    };
  }, [refreshUrl]);

  if (!page.data.length) {
    return (
      <div className="bg-panel rounded-xl border p-8 text-center">
        <h2 className="font-semibold">No events match these filters</h2>
        <p className="text-muted mt-2 text-sm">
          Operational Events are immutable and appear here when filters match.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Operational Event timeline">
      {page.data.map((event) => (
        <li className="bg-panel rounded-xl border p-4" key={event.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{event.message}</p>
              <p className="text-muted mt-1 text-xs">
                {event.type.replaceAll("_", " ")} ·{" "}
                {formatDateTime(event.createdAt)}
              </p>
            </div>
            <span className="bg-panel-raised rounded-full border px-2.5 py-1 text-xs font-semibold">
              {event.severity}
            </span>
          </div>
          <div className="text-muted mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {event.device ? (
              event.device.archived ? (
                <span>
                  {event.device.hostname}{" "}
                  <span className="text-warning">(Archived)</span>
                </span>
              ) : (
                <Link
                  className="text-brand hover:underline"
                  href={`/devices/${event.device.id}`}
                >
                  {event.device.hostname}
                </Link>
              )
            ) : (
              <span>No device</span>
            )}
            <span>{event.actor?.name ?? "System"}</span>
            {event.alert ? <span>Alert: {event.alert.title}</span> : null}
            {event.simulationRun ? (
              <span>Scenario: {event.simulationRun.scenarioCode}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
