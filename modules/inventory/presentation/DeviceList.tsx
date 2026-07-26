import { ChevronLeft, ChevronRight, Server } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/foundation/EmptyState";
import type {
  DevicePage,
  DeviceSummary,
} from "@/modules/inventory/application/device-contracts";
import type { DeviceListQuery } from "@/modules/inventory/domain/device";
import {
  formatDateTime,
  formatMetric,
} from "@/modules/inventory/presentation/device-format";
import { DeviceStatusBadge } from "@/modules/inventory/presentation/DeviceStatusBadge";

function queryHref(query: DeviceListQuery, page: number): Route {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  for (const status of query.statuses) params.append("status", status);
  for (const type of query.types) params.append("type", type);
  if (query.locationId) params.set("locationId", query.locationId);
  params.set("sort", query.sort);
  params.set("order", query.order);
  params.set("page", String(page));
  params.set("pageSize", String(query.pageSize));
  return `/devices?${params.toString()}` as Route;
}

function MobileDeviceCard({ device }: { readonly device: DeviceSummary }) {
  return (
    <article className="bg-panel rounded-xl border p-4 md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            className="hover:text-brand font-semibold"
            href={`/devices/${device.id}`}
          >
            {device.name}
          </Link>
          <p className="text-muted mt-1 truncate font-mono text-xs">
            {device.hostname} · {device.ipAddress}
          </p>
        </div>
        <DeviceStatusBadge status={device.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted text-xs">Type</dt>
          <dd className="mt-1">{device.type}</dd>
        </div>
        <div>
          <dt className="text-muted text-xs">Location</dt>
          <dd className="mt-1">{device.location.name}</dd>
        </div>
        <div>
          <dt className="text-muted text-xs">CPU</dt>
          <dd className="mt-1">
            {formatMetric(device.latestMetrics?.cpuPct, "%")}
          </dd>
        </div>
        <div>
          <dt className="text-muted text-xs">Ping</dt>
          <dd className="mt-1">
            {formatMetric(device.latestMetrics?.pingMs, "ms")}
          </dd>
        </div>
        <div>
          <dt className="text-muted text-xs">Active alerts</dt>
          <dd className="mt-1">{device.activeAlertCount}</dd>
        </div>
      </dl>
      <p className="text-muted mt-3 text-xs">
        Last seen: {formatDateTime(device.lastSeenAt)}
      </p>
    </article>
  );
}

export function DeviceList({
  page,
  query,
}: {
  readonly page: DevicePage;
  readonly query: DeviceListQuery;
}) {
  if (!page.data.length) {
    return (
      <EmptyState
        description="No active devices match the current search and filters. Clear the filters or add a device with an Administrator account."
        title="No devices found"
      />
    );
  }

  return (
    <section aria-labelledby="device-results">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold" id="device-results">
          Device inventory
        </h2>
        <p className="text-muted text-xs">
          {page.meta.total} active device{page.meta.total === 1 ? "" : "s"} ·
          page {page.meta.page} of {page.meta.totalPages}
        </p>
      </div>

      <div className="space-y-3 md:hidden">
        {page.data.map((device) => (
          <MobileDeviceCard device={device} key={device.id} />
        ))}
      </div>

      <div className="bg-panel hidden overflow-x-auto rounded-xl border md:block">
        <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Active SecureNet Demo device inventory
          </caption>
          <thead className="bg-panel-raised text-muted text-xs">
            <tr>
              {[
                "Device",
                "Type",
                "IP",
                "Status",
                "CPU",
                "RAM",
                "Ping",
                "Loss",
                "Alerts",
                "Last seen",
              ].map((label) => (
                <th className="px-4 py-3 font-semibold" key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.data.map((device) => (
              <tr
                className="border-t transition-colors hover:bg-[var(--surface-raised)]"
                key={device.id}
              >
                <th className="px-4 py-3 font-medium" scope="row">
                  <Link
                    className="hover:text-brand inline-flex items-center gap-2"
                    href={`/devices/${device.id}`}
                  >
                    <Server aria-hidden="true" className="text-muted size-4" />
                    <span>
                      <span className="block">{device.name}</span>
                      <span className="text-muted font-mono text-xs font-normal">
                        {device.hostname}
                      </span>
                    </span>
                  </Link>
                </th>
                <td className="px-4 py-3">{device.type}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {device.ipAddress}
                </td>
                <td className="px-4 py-3">
                  <DeviceStatusBadge status={device.status} />
                </td>
                <td className="px-4 py-3">
                  {formatMetric(device.latestMetrics?.cpuPct, "%")}
                </td>
                <td className="px-4 py-3">
                  {formatMetric(device.latestMetrics?.ramPct, "%")}
                </td>
                <td className="px-4 py-3">
                  {formatMetric(device.latestMetrics?.pingMs, "ms")}
                </td>
                <td className="px-4 py-3">
                  {formatMetric(device.latestMetrics?.packetLossPct, "%")}
                </td>
                <td className="px-4 py-3">{device.activeAlertCount}</td>
                <td className="px-4 py-3 text-xs">
                  {formatDateTime(device.lastSeenAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Device result pages"
        className="mt-4 flex items-center justify-between gap-3"
      >
        {page.meta.page > 1 ? (
          <Link
            className="bg-panel text-muted hover:text-foreground inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold"
            href={queryHref(query, page.meta.page - 1)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Previous
          </Link>
        ) : (
          <span />
        )}
        {page.meta.page < page.meta.totalPages ? (
          <Link
            className="bg-panel text-muted hover:text-foreground inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold"
            href={queryHref(query, page.meta.page + 1)}
          >
            Next
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </nav>
    </section>
  );
}
