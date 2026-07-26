import { AlertTriangle, Clock3 } from "lucide-react";

import type { MetricSnapshot } from "@/modules/inventory/application/device-contracts";
import {
  formatDateTime,
  formatMetric,
  formatUptime,
} from "@/modules/inventory/presentation/device-format";

const metrics = [
  ["CPU", "cpuPct", "%"],
  ["RAM", "ramPct", "%"],
  ["Disk", "diskPct", "%"],
  ["Ping", "pingMs", "ms"],
  ["Packet loss", "packetLossPct", "%"],
  ["Download", "downloadMbps", "Mbps"],
  ["Upload", "uploadMbps", "Mbps"],
] as const;

export function DeviceMetricSnapshot({
  snapshot,
}: {
  readonly snapshot: MetricSnapshot | null;
}) {
  if (!snapshot) {
    return (
      <div className="bg-panel rounded-xl border p-5">
        <div className="flex gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="text-warning mt-0.5 size-5 shrink-0"
          />
          <div>
            <h2 className="font-semibold">Current metrics unavailable</h2>
            <p className="text-muted mt-1 text-sm leading-6">
              This device has no persisted metric snapshot. No value has been
              inferred or replaced with zero.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="current-metrics">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-brand text-xs font-semibold tracking-[0.14em] uppercase">
            Persisted Demo snapshot
          </p>
          <h2 className="mt-1 text-xl font-semibold" id="current-metrics">
            Current metrics
          </h2>
        </div>
        <div className="text-muted flex items-center gap-2 text-xs">
          <Clock3 aria-hidden="true" className="size-4" />
          Source: {formatDateTime(snapshot.sourceTime)}
        </div>
      </div>

      {snapshot.stale ? (
        <div className="border-warning/35 bg-warning/10 text-warning mb-4 rounded-lg border px-3 py-2 text-sm">
          This fixed Demo snapshot is stale. Metrics do not update automatically
          in Sprint 2.
        </div>
      ) : null}

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, field, unit]) => (
          <div className="bg-panel rounded-xl border p-4" key={field}>
            <dt className="text-muted text-xs font-medium">{label}</dt>
            <dd className="mt-2 text-lg font-semibold">
              {formatMetric(snapshot[field], unit)}
            </dd>
          </div>
        ))}
        <div className="bg-panel rounded-xl border p-4">
          <dt className="text-muted text-xs font-medium">Uptime</dt>
          <dd className="mt-2 text-lg font-semibold">
            {formatUptime(snapshot.uptimeSeconds)}
          </dd>
        </div>
      </dl>

      <p className="text-muted mt-3 text-xs">
        Received: {formatDateTime(snapshot.receivedAt)} · Historical charts and
        range selection remain In Progress.
      </p>
    </section>
  );
}
