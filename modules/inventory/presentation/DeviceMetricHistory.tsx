"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";

import type { MetricSnapshot } from "@/modules/inventory/application/device-contracts";

const ranges = ["1h", "6h", "24h", "7d", "30d"] as const;

export function DeviceMetricHistory({
  deviceId,
  timezone,
  trafficUnit,
}: {
  readonly deviceId: string;
  readonly timezone: string;
  readonly trafficUnit: "Mbps" | "Gbps";
}) {
  const [range, setRange] = useState<(typeof ranges)[number]>("24h");
  const [metrics, setMetrics] = useState<readonly MetricSnapshot[]>([]);
  const [status, setStatus] = useState("Loading historical metrics…");

  useEffect(() => {
    let active = true;
    void fetch(`/api/v1/devices/${deviceId}/metrics?range=${range}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("History unavailable");
        return (await response.json()) as { data: MetricSnapshot[] };
      })
      .then((result) => {
        if (active) {
          setMetrics(result.data);
          setStatus(
            result.data.length
              ? `${result.data.length} historical points loaded.`
              : "No metric samples exist in this period.",
          );
        }
      })
      .catch(() => {
        if (active) setStatus("Historical metrics could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [deviceId, range]);

  return (
    <section aria-labelledby="metric-history" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold" id="metric-history">
            Metric history
          </h2>
          <p className="text-muted mt-1 text-sm">
            Persisted Demo samples. Database timestamps remain authoritative.
          </p>
        </div>
        <fieldset>
          <legend className="text-muted mb-1 text-xs">Time range</legend>
          <div className="flex flex-wrap gap-1">
            {ranges.map((value) => (
              <button
                aria-pressed={range === value}
                className={`min-h-11 rounded-lg border px-3 text-sm ${
                  range === value ? "bg-brand text-slate-950" : "bg-panel"
                }`}
                key={value}
                onClick={() => {
                  setStatus("Loading historical metrics…");
                  setRange(value);
                }}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <p aria-live="polite" className="text-muted my-3 text-xs">
        {status}
      </p>
      {metrics.length ? (
        <>
          <div
            aria-label="Historical CPU, RAM, latency, packet loss, download, and upload chart"
            className="bg-panel h-80 rounded-xl border p-3"
            role="img"
          >
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={metrics}>
                <CartesianGrid stroke="var(--border-subtle)" />
                <XAxis dataKey="sourceTime" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  dataKey="cpuPct"
                  dot={false}
                  name="CPU %"
                  stroke="#38bdf8"
                />
                <Line
                  dataKey="ramPct"
                  dot={false}
                  name="RAM %"
                  stroke="#a78bfa"
                />
                <Line
                  dataKey="pingMs"
                  dot={false}
                  name="Ping ms"
                  stroke="#f59e0b"
                />
                <Line
                  dataKey="packetLossPct"
                  dot={false}
                  name="Packet loss %"
                  stroke="#ef4444"
                />
                <Line
                  dataKey="downloadMbps"
                  dot={false}
                  name={`Download ${trafficUnit}`}
                  stroke="#22c55e"
                />
                <Line
                  dataKey="uploadMbps"
                  dot={false}
                  name={`Upload ${trafficUnit}`}
                  stroke="#14b8a6"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <details className="bg-panel mt-4 rounded-xl border p-4">
            <summary className="min-h-11 cursor-pointer font-semibold">
              Accessible metric table
            </summary>
            <div
              aria-label="Scrollable historical metric table"
              className="overflow-x-auto"
              role="region"
              tabIndex={0}
            >
              <table className="mt-3 min-w-[52rem] text-left text-xs">
                <thead>
                  <tr>
                    {[
                      "Time",
                      "CPU",
                      "RAM",
                      "Ping",
                      "Packet loss",
                      "Download",
                      "Upload",
                      "Freshness",
                    ].map((heading) => (
                      <th className="border-b p-2" key={heading}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr key={metric.id}>
                      <td className="border-b p-2">
                        {new Intl.DateTimeFormat("en", {
                          dateStyle: "short",
                          timeStyle: "short",
                          timeZone: timezone,
                        }).format(new Date(metric.sourceTime))}
                      </td>
                      {[
                        metric.cpuPct,
                        metric.ramPct,
                        metric.pingMs,
                        metric.packetLossPct,
                        metric.downloadMbps === null || trafficUnit === "Mbps"
                          ? metric.downloadMbps
                          : metric.downloadMbps / 1000,
                        metric.uploadMbps === null || trafficUnit === "Mbps"
                          ? metric.uploadMbps
                          : metric.uploadMbps / 1000,
                      ].map((value, index) => (
                        <td className="border-b p-2" key={index}>
                          {value === null ? "Unavailable" : value.toFixed(2)}
                        </td>
                      ))}
                      <td className="border-b p-2">
                        {metric.stale ? "Stale" : "Current"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : null}
    </section>
  );
}
