"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardSnapshot } from "@/modules/monitoring/application/dashboard-contracts";

export function TrafficChart({
  data,
  rangeLabel,
}: {
  readonly data: DashboardSnapshot["traffic"];
  readonly rangeLabel: string;
}) {
  const peak = data.reduce(
    (current, point) =>
      point.downloadMbps > current.downloadMbps ? point : current,
    data[0] ?? { time: "n/a", downloadMbps: 0, uploadMbps: 0 },
  );

  return (
    <section
      className="bg-panel rounded-xl border p-5"
      aria-labelledby="traffic-title"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold" id="traffic-title">
            Network traffic
          </h2>
          <p className="text-muted mt-1 text-xs">{rangeLabel}</p>
        </div>
        <div className="text-muted flex gap-3 text-xs" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="bg-info size-2 rounded-full" />
            Download
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-brand size-2 rounded-full" />
            Upload
          </span>
        </div>
      </div>
      <div className="h-64 w-full" aria-hidden="true">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            accessibilityLayer={false}
            data={data}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
          >
            <CartesianGrid
              stroke="var(--border-subtle)"
              strokeDasharray="3 3"
            />
            <XAxis
              axisLine={false}
              dataKey="time"
              fontSize={11}
              stroke="var(--text-secondary)"
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              fontSize={11}
              stroke="var(--text-secondary)"
              tickLine={false}
              unit="M"
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface-overlay)",
                border: "1px solid var(--border-strong)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value, name) => [
                `${Number(value)} Mbps`,
                name === "downloadMbps" ? "Download" : "Upload",
              ]}
            />
            <Line
              dataKey="downloadMbps"
              dot={false}
              isAnimationActive={false}
              stroke="var(--status-info)"
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="uploadMbps"
              dot={false}
              isAnimationActive={false}
              stroke="var(--accent-primary)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-muted mt-3 text-xs leading-5">
        Text summary: peak fixture download is {peak.downloadMbps} Mbps at{" "}
        {peak.time}; upload at that point is {peak.uploadMbps} Mbps.
      </p>
    </section>
  );
}
