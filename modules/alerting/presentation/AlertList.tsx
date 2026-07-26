import Link from "next/link";

import type { AlertPage } from "@/modules/alerting/application/alert-contracts";
import { AlertActions } from "@/modules/alerting/presentation/AlertActions";
import { formatDateTime } from "@/modules/inventory/presentation/device-format";
import type { UserRole } from "@/modules/shared/domain/network";

function badgeClass(value: string): string {
  if (value === "CRITICAL" || value === "OPEN") {
    return "border-danger/40 bg-danger/10 text-danger";
  }
  if (value === "WARNING" || value === "INVESTIGATING") {
    return "border-warning/40 bg-warning/10 text-warning";
  }
  if (value === "ACKNOWLEDGED") {
    return "border-info/40 bg-info/10 text-info";
  }
  return "border-success/40 bg-success/10 text-success";
}

export function AlertList({
  page,
  role,
}: {
  readonly page: AlertPage;
  readonly role: UserRole;
}) {
  if (!page.data.length) {
    return (
      <div className="bg-panel rounded-xl border p-8 text-center">
        <h2 className="font-semibold">No alerts match these filters</h2>
        <p className="text-muted mt-2 text-sm">
          Clear filters to inspect the deterministic Demo alert history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {page.data.map((alert) => (
        <details className="bg-panel rounded-xl border" key={alert.id}>
          <summary className="min-h-16 cursor-pointer list-none p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold">{alert.title}</h2>
                <p className="text-muted mt-1 text-sm">
                  {alert.device.hostname} · {formatDateTime(alert.openedAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(alert.severity)}`}
                >
                  {alert.severity}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(alert.status)}`}
                >
                  {alert.status.replaceAll("_", " ")}
                </span>
              </div>
            </div>
          </summary>
          <div className="border-t p-4">
            <p className="text-muted text-sm leading-6">{alert.description}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-muted text-xs">Device</dt>
                <dd>
                  {alert.device.archived ? (
                    <>
                      {alert.device.name}{" "}
                      <span className="text-warning">(Archived)</span>
                    </>
                  ) : (
                    <Link
                      className="text-brand hover:underline"
                      href={`/devices/${alert.device.id}`}
                    >
                      {alert.device.name}
                    </Link>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Rule / source</dt>
                <dd>
                  {alert.alertRule?.code ?? "No rule"} ·{" "}
                  {alert.source.replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Last triggered</dt>
                <dd>{formatDateTime(alert.lastTriggeredAt)}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Acknowledged by</dt>
                <dd>{alert.acknowledgedBy?.name ?? "Not acknowledged"}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Assignee</dt>
                <dd>{alert.assignee?.name ?? "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Resolved by</dt>
                <dd>{alert.resolvedBy?.name ?? "Not resolved"}</dd>
              </div>
            </dl>
            {alert.acknowledgementNote ? (
              <p className="text-muted mt-3 text-sm">
                Acknowledgement: {alert.acknowledgementNote}
              </p>
            ) : null}
            {alert.resolutionNote ? (
              <p className="text-muted mt-2 text-sm">
                Resolution: {alert.resolutionNote}
              </p>
            ) : null}
            <AlertActions alert={alert} role={role} />
          </div>
        </details>
      ))}
    </div>
  );
}
