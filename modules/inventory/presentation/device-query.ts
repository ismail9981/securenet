import { deviceListQuerySchema } from "@/modules/inventory/domain/device";

function arrayValues(searchParams: URLSearchParams, name: string): string[] {
  return searchParams
    .getAll(name)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseDeviceListQuery(searchParams: URLSearchParams) {
  return deviceListQuerySchema.parse({
    search: searchParams.get("search") ?? undefined,
    statuses: arrayValues(searchParams, "status"),
    types: arrayValues(searchParams, "type"),
    locationId: searchParams.get("locationId") || undefined,
    sort: searchParams.get("sort") ?? undefined,
    order: searchParams.get("order") ?? undefined,
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "20"),
  });
}
