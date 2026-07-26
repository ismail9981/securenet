import type { DeviceStatus } from "@/modules/shared/domain/network";
import { cn } from "@/lib/cn";

const statusStyles: Readonly<Record<DeviceStatus, string>> = {
  ONLINE: "border-success/35 bg-success/10 text-success",
  DEGRADED: "border-warning/35 bg-warning/10 text-warning",
  OFFLINE: "border-danger/35 bg-danger/10 text-danger",
  MAINTENANCE: "border-info/35 bg-info/10 text-info",
  UNKNOWN: "border-border bg-panel-raised text-muted",
};

export function DeviceStatusBadge({
  status,
}: {
  readonly status: DeviceStatus;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
