import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly tone: "brand" | "success" | "warning" | "danger" | "muted";
  readonly value: number;
}

const toneClasses = {
  brand: "border-brand/25 bg-brand/10 text-brand",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
  muted: "border-border bg-panel-raised text-muted",
} as const;

export function KpiCard({ icon: Icon, label, tone, value }: KpiCardProps) {
  return (
    <article className="bg-panel rounded-xl border p-4 sm:p-5">
      <div
        className={`mb-5 grid size-9 place-items-center rounded-lg border ${toneClasses[tone]}`}
      >
        <Icon aria-hidden="true" className="size-4" />
      </div>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="text-muted mt-1 text-sm">{label}</p>
    </article>
  );
}
