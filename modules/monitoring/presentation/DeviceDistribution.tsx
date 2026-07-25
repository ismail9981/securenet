import type { DashboardSnapshot } from "@/modules/monitoring/application/dashboard-contracts";

const STATUS_STYLES = {
  ONLINE: { label: "Online", className: "bg-success" },
  DEGRADED: { label: "Degraded", className: "bg-warning" },
  OFFLINE: { label: "Offline", className: "bg-danger" },
  MAINTENANCE: { label: "Maintenance", className: "bg-info" },
  UNKNOWN: { label: "Unknown", className: "bg-[var(--status-unknown)]" },
} as const;

export function DeviceDistribution({
  distribution,
  total,
}: {
  readonly distribution: DashboardSnapshot["deviceDistribution"];
  readonly total: number;
}) {
  return (
    <section
      className="bg-panel rounded-xl border p-5"
      aria-labelledby="distribution"
    >
      <h2 className="font-semibold" id="distribution">
        Device status distribution
      </h2>
      <p className="text-muted mt-1 text-xs">
        {total}-device deterministic Demo environment
      </p>
      <ul className="mt-5 space-y-4">
        {distribution.map(({ count, status }) => {
          const style = STATUS_STYLES[status];
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <li key={status}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`size-2 rounded-full ${style.className}`}
                  />
                  {style.label}
                </span>
                <span className="font-medium tabular-nums">
                  {count}{" "}
                  <span className="text-muted text-xs">({percent}%)</span>
                </span>
              </div>
              <div className="bg-panel-raised h-1.5 overflow-hidden rounded-full">
                <div
                  aria-hidden="true"
                  className={`h-full rounded-full ${style.className}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
