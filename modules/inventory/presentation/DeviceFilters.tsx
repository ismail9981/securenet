import type { LocationOption } from "@/modules/inventory/application/device-contracts";
import type { DeviceListQuery } from "@/modules/inventory/domain/device";
import { DEVICE_STATUSES, DEVICE_TYPES } from "@/modules/shared/domain/network";

export function DeviceFilters({
  locations,
  query,
}: {
  readonly locations: readonly LocationOption[];
  readonly query: DeviceListQuery;
}) {
  return (
    <form
      action="/devices"
      className="bg-panel grid gap-3 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_repeat(5,minmax(8rem,auto))_auto]"
      method="get"
    >
      <label className="text-sm font-medium">
        Search
        <input
          className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3 text-sm"
          defaultValue={query.search}
          name="search"
          placeholder="Name, hostname, or exact IP"
          type="search"
        />
      </label>
      <label className="text-sm font-medium">
        Status
        <select
          className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3 text-sm"
          defaultValue={query.statuses[0] ?? ""}
          name="status"
        >
          <option value="">All statuses</option>
          {DEVICE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Type
        <select
          className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3 text-sm"
          defaultValue={query.types[0] ?? ""}
          name="type"
        >
          <option value="">All types</option>
          {DEVICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Location
        <select
          className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3 text-sm"
          defaultValue={query.locationId ?? ""}
          name="locationId"
        >
          <option value="">All locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Sort
        <select
          className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3 text-sm"
          defaultValue={query.sort}
          name="sort"
        >
          <option value="name">Name</option>
          <option value="status">Status</option>
          <option value="ping">Ping</option>
          <option value="lastSeen">Last seen</option>
        </select>
      </label>
      <label className="text-sm font-medium">
        Order
        <select
          className="bg-background mt-1.5 min-h-11 w-full rounded-lg border px-3 text-sm"
          defaultValue={query.order}
          name="order"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>
      <button
        className="bg-brand min-h-11 self-end rounded-lg px-4 text-sm font-semibold text-slate-950"
        type="submit"
      >
        Apply
      </button>
    </form>
  );
}
