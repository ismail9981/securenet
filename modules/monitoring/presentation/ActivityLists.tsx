import { AlertTriangle, ArrowRight, Clock3 } from "lucide-react";
import Link from "next/link";

import type { DashboardSnapshot } from "@/modules/monitoring/application/dashboard-contracts";

function formatMuscatTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Muscat",
  }).format(new Date(value));
}

export function LatestAlerts({
  alerts,
}: {
  readonly alerts: DashboardSnapshot["latestAlerts"];
}) {
  return (
    <section
      className="bg-panel rounded-xl border"
      aria-labelledby="latest-alerts"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="font-semibold" id="latest-alerts">
          Latest alerts
        </h2>
        <Link
          className="text-brand flex items-center gap-1 text-xs font-semibold"
          href="/alerts"
        >
          View all <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
      {alerts.length === 0 ? (
        <p className="text-muted px-5 py-8 text-center text-sm">
          No alerts are present in this Demo snapshot.
        </p>
      ) : (
        <ul className="divide-y">
          {alerts.map((alert) => (
            <li className="flex gap-3 px-5 py-4" key={alert.id}>
              <AlertTriangle
                aria-hidden="true"
                className={`mt-0.5 size-4 shrink-0 ${
                  alert.severity === "CRITICAL" ? "text-danger" : "text-warning"
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-muted mt-1 text-xs">
                  {alert.deviceName} · {formatMuscatTime(alert.openedAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RecentEvents({
  events,
}: {
  readonly events: DashboardSnapshot["recentEvents"];
}) {
  return (
    <section
      className="bg-panel rounded-xl border"
      aria-labelledby="recent-events"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="font-semibold" id="recent-events">
          Recent events
        </h2>
        <Link
          className="text-brand flex items-center gap-1 text-xs font-semibold"
          href="/events"
        >
          View all <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="text-muted px-5 py-8 text-center text-sm">
          No events are present in this Demo snapshot.
        </p>
      ) : (
        <ul className="divide-y">
          {events.map((event) => (
            <li className="flex gap-3 px-5 py-4" key={event.id}>
              <Clock3
                aria-hidden="true"
                className="text-info mt-0.5 size-4 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{event.message}</p>
                <p className="text-muted mt-1 text-xs">
                  {event.type} · {formatMuscatTime(event.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
