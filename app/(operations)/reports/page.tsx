import { BarChart3, Download } from "lucide-react";
import type { Metadata } from "next";

import { requireServerSession } from "@/modules/identity/infrastructure/server-session";
import { parseReportFilters } from "@/modules/reporting/domain/report-filters";
import { reportService } from "@/modules/reporting/infrastructure/report-service";
import { ReportFilters } from "@/modules/reporting/presentation/ReportFilters";

export const metadata: Metadata = { title: "Network Health Report" };

function inputDate(date: Date): string {
  return date.toISOString().slice(0, 16);
}

export default async function ReportsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireServerSession();
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value) {
      params.set(
        key,
        (key === "from" || key === "to") && !value.includes("Z")
          ? new Date(value).toISOString()
          : value,
      );
    }
  }
  const filters = parseReportFilters(params);
  const report = await reportService.networkHealth(filters, {
    actor: session.user,
  });
  const exportParams = new URLSearchParams(params);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header>
        <div className="border-brand/25 bg-brand/10 text-brand mb-4 flex size-11 items-center justify-center rounded-xl border">
          <BarChart3 aria-hidden="true" className="size-5" />
        </div>
        <p className="text-brand text-xs font-semibold tracking-[0.16em] uppercase">
          Persisted Demo reporting
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          Network Health Report
        </h1>
        <p className="text-muted mt-2">{report.demoDisclosure}</p>
      </header>

      <ReportFilters
        values={{
          from: inputDate(filters.from),
          to: inputDate(filters.to),
          severity: filters.severity ?? "",
          alertStatus: filters.alertStatus ?? "",
          deviceStatus: filters.deviceStatus ?? "",
        }}
      />

      <div>
        <a
          className="bg-brand inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-semibold text-slate-950"
          href={`/api/v1/reports/alerts.csv?${exportParams.toString()}`}
        >
          <Download aria-hidden="true" className="size-4" />
          Export filtered Alerts CSV
        </a>
      </div>

      <section aria-labelledby="device-summary">
        <h2 className="mb-3 text-xl font-semibold" id="device-summary">
          Device summary
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {Object.entries(report.deviceCounts).map(([label, value]) => (
            <div className="bg-panel rounded-xl border p-4" key={label}>
              <dt className="text-muted text-xs">{label}</dt>
              <dd className="mt-2 text-2xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="bg-panel rounded-xl border p-5">
          <h2 className="font-semibold">Alerts by severity</h2>
          <dl className="mt-3 grid grid-cols-3 gap-2">
            {Object.entries(report.alertsBySeverity).map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted text-xs">{label}</dt>
                <dd className="text-xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="bg-panel rounded-xl border p-5">
          <h2 className="font-semibold">Alerts by status</h2>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(report.alertsByStatus).map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted text-xs">{label}</dt>
                <dd className="text-xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-panel rounded-xl border p-5">
        <h2 className="font-semibold">Period metrics</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(report.metrics).map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted text-xs">
                {label}
                {label.startsWith("total") ? ` (${report.trafficUnit})` : ""}
              </dt>
              <dd className="mt-1 font-semibold">
                {value === null
                  ? "Unavailable"
                  : (report.trafficUnit === "Gbps" && label.startsWith("total")
                      ? value / 1000
                      : value
                    ).toFixed(2)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-panel rounded-xl border p-5">
        <h2 className="font-semibold">
          Partial Network Health Score: {report.health.score} ·{" "}
          {report.health.label}
        </h2>
        <p className="text-muted mt-2 text-sm">
          This score uses only approved fixed deductions. Packet-loss, ping, and
          degraded-ratio interpolation remain unspecified and are not inferred.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Top problem Devices</h2>
        {report.topProblemDevices.length ? (
          <div className="overflow-x-auto rounded-xl border">
            <table className="bg-panel w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Device</th>
                  <th className="p-3">Hostname</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Active Alerts</th>
                </tr>
              </thead>
              <tbody>
                {report.topProblemDevices.map((device) => (
                  <tr className="border-b last:border-0" key={device.id}>
                    <td className="p-3">{device.name}</td>
                    <td className="p-3 font-mono">{device.hostname}</td>
                    <td className="p-3">{device.status}</td>
                    <td className="p-3">{device.activeAlertCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="bg-panel text-muted rounded-xl border p-6">
            No Devices match this period and filter set.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Recent Alerts</h2>
        <ul className="grid gap-3">
          {report.recentAlerts.map((alert) => (
            <li className="bg-panel rounded-xl border p-4" key={alert.id}>
              <p className="font-semibold">{alert.title}</p>
              <p className="text-muted text-sm">
                {alert.deviceName} · {alert.severity} · {alert.status}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
