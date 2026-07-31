import { CircleHelp } from "lucide-react";

export function PortfolioDemoDisclosure() {
  return (
    <aside
      aria-label="Portfolio Demo disclosure"
      className="border-info/30 bg-info/10 text-muted rounded-xl border p-4 text-sm leading-6"
    >
      <div className="flex items-start gap-3">
        <CircleHelp
          aria-hidden="true"
          className="text-info mt-0.5 size-4 shrink-0"
        />
        <p>
          <strong className="text-foreground">Portfolio Demo:</strong> this is a
          read-only public Viewer experience on free hosting. The persistent
          realtime simulation worker is unavailable here; simulation controls
          require the full production deployment architecture.
        </p>
      </div>
    </aside>
  );
}
