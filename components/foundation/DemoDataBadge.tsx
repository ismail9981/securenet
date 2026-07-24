import { FlaskConical } from "lucide-react";

export function DemoDataBadge() {
  return (
    <span className="border-info/30 bg-info/10 text-info inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold">
      <FlaskConical aria-hidden="true" className="size-3.5" />
      Demo · Simulated
    </span>
  );
}
