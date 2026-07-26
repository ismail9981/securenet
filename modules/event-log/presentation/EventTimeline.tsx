import Link from "next/link";

import type { EventPage } from "@/modules/event-log/application/event-contracts";
import { formatDateTime } from "@/modules/inventory/presentation/device-format";

export function EventTimeline({ page }: { readonly page: EventPage }) {
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
          </div>
        </li>
      ))}
    </ol>
  );
}
