import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { OperationalPageHeader } from "@/components/foundation/OperationalPageHeader";

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
      <OperationalPageHeader
        description="Search, filter, and inspect the PostgreSQL-backed operational inventory. Metric snapshots remain deterministic demonstration data."
        eyebrow="Asset inventory"
        index="02"
        metadata={[
          { label: "Active", value: page.meta.total },
          { label: "Page", value: `${page.meta.page}/${page.meta.totalPages}` },
          { label: "Access", value: canManage ? "MANAGE" : "READ ONLY" },
          { label: "Source", value: "POSTGRES" },
        ]}
        title="Devices"
      />

      {canManage ? (
        <details className="bg-panel mb-6 border p-4">
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
        <p className="bg-panel text-muted mb-6 border-l-2 border-l-[var(--accent-primary)] px-4 py-3 text-sm">
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
