import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly tone: "brand" | "success" | "warning" | "danger" | "muted";
  readonly value: number;
}

const toneClasses = {
  brand: "text-brand",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  muted: "text-muted",
} as const;

export function KpiCard({ icon: Icon, label, tone, value }: KpiCardProps) {
  return (
    <article className="group bg-panel relative min-h-32 p-4 sm:p-5">
      <div className={`absolute top-4 right-4 ${toneClasses[tone]}`}>
        <Icon aria-hidden="true" className="size-4" />
      </div>
      <p className="text-4xl font-medium tracking-[-0.06em] tabular-nums">
        {value}
      </p>
      <p className="text-muted mt-5 font-mono text-[0.62rem] tracking-[0.08em] uppercase">
        {label}
      </p>
      <span
        className={`absolute bottom-0 left-0 h-px w-0 transition-[width] duration-300 group-hover:w-full ${toneClasses[tone]} bg-current`}
      />
    </article>
  );
}
