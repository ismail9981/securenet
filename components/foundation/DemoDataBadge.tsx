import { FlaskConical } from "lucide-react";

export function DemoDataBadge() {
  return (
    <span className="text-info inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[0.6rem] font-semibold tracking-[0.08em] uppercase">
      <FlaskConical aria-hidden="true" className="size-3.5" />
      Demo <span className="hidden sm:inline">· Simulated</span>
    </span>
  );
}
