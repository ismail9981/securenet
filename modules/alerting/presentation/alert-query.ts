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
    statuses: arrayValues(searchParams, "status"),
    deviceId: searchParams.get("deviceId") || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
  });
}
