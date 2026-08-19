import type { DashboardSnapshot } from "@/modules/monitoring/application/dashboard-contracts";
import { CursorGrid } from "@/components/foundation/CursorGrid";

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
    <CursorGrid className="bg-panel min-h-[22rem] border p-6 sm:p-8">
      <section aria-labelledby="health-score">
        <div className="flex h-full flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div
            aria-label={`Network Health Score ${health.score} out of 100, ${labelText[health.label]}`}
            className="relative flex min-h-48 flex-1 items-end"
            role="img"
          >
            <div>
              <p className="text-muted font-mono text-[0.64rem] tracking-[0.12em] uppercase">
                Network health
              </p>
              <p className="mt-2 text-[7rem] leading-[0.8] font-medium tracking-[-0.09em] tabular-nums sm:text-[9rem]">
                {health.score}
              </p>
              <p className="text-muted mt-3 font-mono text-xs">
                / 100 · {health.deductionTotal} PTS DEDUCTED
              </p>
            </div>
            <div className="absolute right-0 bottom-0 h-full w-px bg-[var(--border-subtle)]" />
          </div>
          <div className="max-w-sm sm:pl-4">
            <p className="text-warning text-xs font-semibold tracking-[0.14em] uppercase">
              {labelText[health.label]}
            </p>
            <h2 className="mt-2 text-2xl font-medium" id="health-score">
              Network Health Score
            </h2>
            <p className="text-muted mt-2 text-sm leading-6">
              This Demo score applies only the documented fixed deductions for
              offline devices and open alerts.
            </p>
            <p className="border-warning/30 text-warning mt-5 border-l pl-3 font-mono text-[0.65rem] leading-5">
              Formula incomplete: packet loss, ping, and degraded-ratio
              interpolation remain intentionally excluded pending an approved
              formula.
            </p>
          </div>
        </div>
      </section>
    </CursorGrid>
  );
}
