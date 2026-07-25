import type { DashboardSnapshot } from "@/modules/monitoring/application/dashboard-contracts";

const labelText = {
  EXCELLENT: "Excellent",
  HEALTHY: "Healthy",
  WARNING: "Warning",
  CRITICAL: "Critical",
} as const;

export function HealthScorePanel({
  health,
}: {
  readonly health: DashboardSnapshot["networkHealth"];
}) {
  return (
    <section
      className="bg-panel rounded-xl border p-5"
      aria-labelledby="health-score"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          aria-label={`Network Health Score ${health.score} out of 100, ${labelText[health.label]}`}
          className="relative grid size-32 shrink-0 place-items-center rounded-full"
          role="img"
          style={{
            background: `conic-gradient(var(--status-warning) ${health.score}%, var(--surface-raised) 0)`,
          }}
        >
          <div className="bg-panel grid size-24 place-items-center rounded-full border text-center">
            <div>
              <p className="text-3xl font-semibold tabular-nums">
                {health.score}
              </p>
              <p className="text-muted text-xs">of 100</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-warning text-xs font-semibold tracking-[0.14em] uppercase">
            {labelText[health.label]}
          </p>
          <h2 className="mt-2 text-lg font-semibold" id="health-score">
            Network Health Score
          </h2>
          <p className="text-muted mt-2 text-sm leading-6">
            This Demo score applies only the documented fixed deductions for
            offline devices and open alerts.
          </p>
          <p className="border-warning/25 bg-warning/10 text-warning mt-3 rounded-lg border px-3 py-2 text-xs leading-5">
            Formula incomplete: packet loss, ping, and degraded-ratio
            interpolation remain intentionally excluded pending an approved
            formula.
          </p>
        </div>
      </div>
    </section>
  );
}
