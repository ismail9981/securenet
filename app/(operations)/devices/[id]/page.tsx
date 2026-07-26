import { ArrowLeft, CircleAlert, History, ServerCog } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { hasPermission } from "@/modules/identity/domain/permissions";
import { requireServerSession } from "@/modules/identity/infrastructure/server-session";
import { DeviceNotFoundError } from "@/modules/inventory/application/device-errors";
import {
  deviceIdSchema,
  deviceListQuerySchema,
} from "@/modules/inventory/domain/device";
import { deviceService } from "@/modules/inventory/infrastructure/device-service";
import { ArchiveDeviceButton } from "@/modules/inventory/presentation/ArchiveDeviceButton";
import { DeviceForm } from "@/modules/inventory/presentation/DeviceForm";
import { DeviceMetricSnapshot } from "@/modules/inventory/presentation/DeviceMetricSnapshot";
import { DeviceStatusBadge } from "@/modules/inventory/presentation/DeviceStatusBadge";
import { formatDateTime } from "@/modules/inventory/presentation/device-format";

export const metadata: Metadata = {
  title: "Device details",
};

interface DeviceDetailsPageProps {
  readonly params: Promise<{ readonly id: string }>;
}

export default async function DeviceDetailsPage({
  params,
}: DeviceDetailsPageProps) {
  const session = await requireServerSession();
  const actor = { actor: session.user };
  const parsedId = deviceIdSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();
  const id = parsedId.data;

  let device;
  try {
    device = await deviceService.getById(id, actor);
  } catch (error) {
    if (error instanceof DeviceNotFoundError) notFound();
    throw error;
  }

  const canManage = hasPermission(session.user.role, "MANAGE_DEVICES");
  const [locations, parentCandidates] = canManage
    ? await Promise.all([
        deviceService.listLocations(actor),
        deviceService
          .list(deviceListQuerySchema.parse({ pageSize: 100 }), actor)
          .then((result) => result.data),
      ])
    : [[], []];

  const overview = [
    ["Immutable ID", device.id],
    ["Hostname", device.hostname],
    ["IP address", device.ipAddress],
    ["MAC address", device.macAddress ?? "Unavailable"],
    ["Type", device.type],
    ["Operating system", device.osName ?? "Unavailable"],
    ["Location", device.location.name],
    [
      "Parent device",
      device.parentDevice
        ? `${device.parentDevice.name} · ${device.parentDevice.hostname}`
        : "No parent recorded",
    ],
    ["Importance", `${device.importanceWeight} / 5`],
    ["Last seen", formatDateTime(device.lastSeenAt)],
    ["Created", formatDateTime(device.createdAt)],
    ["Updated", formatDateTime(device.updatedAt)],
  ] as const;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Link
        className="text-muted hover:text-foreground mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold"
        href="/devices"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to devices
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="border-brand/25 bg-brand/10 text-brand mb-4 flex size-11 items-center justify-center rounded-xl border">
            <ServerCog aria-hidden="true" className="size-5" />
          </div>
          <p className="text-brand text-xs font-semibold tracking-[0.16em] uppercase">
            Device diagnostics · Persisted Demo data
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {device.name}
            </h1>
            <DeviceStatusBadge status={device.status} />
          </div>
          <p className="text-muted mt-2 font-mono text-sm">
            {device.hostname} · {device.ipAddress}
          </p>
        </div>
        {canManage ? (
          <ArchiveDeviceButton deviceId={device.id} deviceName={device.name} />
        ) : (
          <span className="bg-panel text-muted rounded-lg border px-3 py-2 text-xs">
            Read-only access
          </span>
        )}
      </header>

      <section aria-labelledby="overview">
        <h2 className="mb-4 text-xl font-semibold" id="overview">
          Overview
        </h2>
        <dl className="bg-panel grid gap-px overflow-hidden rounded-xl border bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
          {overview.map(([label, value]) => (
            <div className="bg-panel min-w-0 p-4" key={label}>
              <dt className="text-muted text-xs font-medium">{label}</dt>
              <dd className="mt-1 text-sm break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8">
        <DeviceMetricSnapshot snapshot={device.latestMetrics} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section
          aria-labelledby="related-alerts"
          className="bg-panel rounded-xl border p-5"
        >
          <CircleAlert aria-hidden="true" className="text-muted size-5" />
          <h2 className="mt-3 font-semibold" id="related-alerts">
            Related alerts unavailable
          </h2>
          <p className="text-muted mt-2 text-sm leading-6">
            Alert persistence and evaluation belong to Sprint 3.
            activeAlertCount is intentionally unavailable rather than reported
            as zero.
          </p>
        </section>
        <section
          aria-labelledby="related-events"
          className="bg-panel rounded-xl border p-5"
        >
          <History aria-hidden="true" className="text-muted size-5" />
          <h2 className="mt-3 font-semibold" id="related-events">
            Related events unavailable
          </h2>
          <p className="text-muted mt-2 text-sm leading-6">
            Full Event Log persistence and browsing remain Sprint 3. Device
            mutation audit records are stored server-side but have no Sprint 2
            UI.
          </p>
        </section>
      </div>

      {canManage ? (
        <details className="bg-panel mt-8 rounded-xl border p-5">
          <summary className="text-brand min-h-11 cursor-pointer list-none font-semibold">
            Edit device
          </summary>
          <DeviceForm
            initial={device}
            locations={locations}
            mode="update"
            parents={parentCandidates}
          />
        </details>
      ) : null}
    </div>
  );
}
