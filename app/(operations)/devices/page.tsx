import { Plus, Server } from "lucide-react";
import type { Metadata } from "next";

import { hasPermission } from "@/modules/identity/domain/permissions";
import { requireServerSession } from "@/modules/identity/infrastructure/server-session";
import { deviceListQuerySchema } from "@/modules/inventory/domain/device";
import { deviceService } from "@/modules/inventory/infrastructure/device-service";
import { DeviceFilters } from "@/modules/inventory/presentation/DeviceFilters";
import { DeviceForm } from "@/modules/inventory/presentation/DeviceForm";
import { DeviceList } from "@/modules/inventory/presentation/DeviceList";
import { parseDeviceListQuery } from "@/modules/inventory/presentation/device-query";

export const metadata: Metadata = {
  title: "Devices",
};

interface DevicesPageProps {
  readonly searchParams: Promise<
    Record<string, string | readonly string[] | undefined>
  >;
}

function toUrlSearchParams(
  values: Record<string, string | readonly string[] | undefined>,
): URLSearchParams {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") {
      result.set(key, value);
    } else if (value) {
      for (const item of value) result.append(key, item);
    }
  }
  return result;
}

export default async function DevicesPage({ searchParams }: DevicesPageProps) {
  const session = await requireServerSession();
  const actor = { actor: session.user };
  const query = parseDeviceListQuery(toUrlSearchParams(await searchParams));
  const [page, locations] = await Promise.all([
    deviceService.list(query, actor),
    deviceService.listLocations(actor),
  ]);
  const canManage = hasPermission(session.user.role, "MANAGE_DEVICES");
  const parentCandidates = canManage
    ? (
        await deviceService.list(
          deviceListQuerySchema.parse({ pageSize: 100 }),
          actor,
        )
      ).data
    : [];

  return (
    <div className="mx-auto w-full max-w-[90rem]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="border-brand/25 bg-brand/10 text-brand mb-4 flex size-11 items-center justify-center rounded-xl border">
            <Server aria-hidden="true" className="size-5" />
          </div>
          <p className="text-brand text-xs font-semibold tracking-[0.16em] uppercase">
            Inventory · Persisted Demo data
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Devices
          </h1>
          <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
            Search and inspect the PostgreSQL-backed 30-device Demo inventory.
            Metrics are fixed fixtures and do not update automatically.
          </p>
        </div>
      </header>

      {canManage ? (
        <details className="bg-panel mb-6 rounded-xl border p-4">
          <summary className="text-brand flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold">
            <Plus aria-hidden="true" className="size-4" />
            Add device
          </summary>
          <p className="text-muted mt-2 text-sm">
            Administrator changes are validated, authorized, and written to the
            append-only audit log.
          </p>
          <DeviceForm
            locations={locations}
            mode="create"
            parents={parentCandidates}
          />
        </details>
      ) : (
        <p className="bg-panel text-muted mb-6 rounded-xl border px-4 py-3 text-sm">
          Your {session.user.role.replaceAll("_", " ").toLowerCase()} account
          has read-only device access.
        </p>
      )}

      <DeviceFilters locations={locations} query={query} />
      <div className="mt-6">
        <DeviceList page={page} query={query} />
      </div>
    </div>
  );
}
