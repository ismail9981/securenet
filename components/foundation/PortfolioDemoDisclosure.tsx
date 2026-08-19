import { CircleHelp, RadioTower } from "lucide-react";

export function PortfolioDemoDisclosure() {
  return (
    <aside
      aria-label="Portfolio Demo disclosure"
      className="bg-panel text-muted relative overflow-hidden border px-4 py-3 text-sm leading-6"
    >
      <span className="bg-info absolute inset-y-0 left-0 w-px" />
      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="text-info flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.1em] uppercase">
          <RadioTower aria-hidden="true" className="size-4" />
          Public portfolio
        </div>
        <p className="text-xs leading-5 sm:border-l sm:pl-4">
          <strong className="text-foreground font-medium">
            Read-only public Viewer experience.
          </strong>{" "}
          The persistent simulation worker is unavailable here; production
          capabilities require the full deployment architecture.
        </p>
        <CircleHelp
          aria-hidden="true"
          className="text-muted hidden size-4 sm:block"
        />
      </div>
    </aside>
  );
}
