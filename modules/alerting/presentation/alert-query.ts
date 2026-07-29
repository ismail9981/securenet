import { alertListQuerySchema } from "@/modules/alerting/domain/alert";

function arrayValues(searchParams: URLSearchParams, name: string): string[] {
  return searchParams
    .getAll(name)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseAlertListQuery(searchParams: URLSearchParams) {
  return alertListQuerySchema.parse({
    page: Number(searchParams.get("page") ?? "1"),
    pageSize: Number(searchParams.get("pageSize") ?? "20"),
    severities: arrayValues(searchParams, "severity"),
    statuses: arrayValues(searchParams, "alertStatus").length
      ? arrayValues(searchParams, "alertStatus")
      : arrayValues(searchParams, "status"),
    deviceId: searchParams.get("deviceId") || undefined,
    deviceStatus: searchParams.get("deviceStatus") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });
}
