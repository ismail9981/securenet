import { Network } from "lucide-react";
import type { Metadata } from "next";

import { requireServerSession } from "@/modules/identity/infrastructure/server-session";
import { hasPermission } from "@/modules/identity/domain/permissions";
import { topologyService } from "@/modules/topology/infrastructure/topology-service";
import { TopologyExplorer } from "@/modules/topology/presentation/TopologyExplorer";

export const metadata: Metadata = { title: "Topology" };

export default async function TopologyPage() {
  const session = await requireServerSession();
  const snapshot = await topologyService.getActiveSnapshot({
    actor: session.user,
  });
  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-6">
        <div className="border-brand/25 bg-brand/10 text-brand mb-4 flex size-11 items-center justify-center rounded-xl border">
          <Network aria-hidden="true" className="size-5" />
        </div>
        <p className="text-brand text-xs font-semibold tracking-[0.16em] uppercase">
          Active network relationships · Persisted Demo data
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Topology
        </h1>
        <p className="text-muted mt-2 max-w-3xl text-sm">
          Active Devices and documented connections. Links are visually
          undirected; capacity remains unavailable and no connection editing is
          provided.
        </p>
      </header>
      <div
        aria-label="Topology status legend"
        className="mb-6 flex flex-wrap gap-2"
      >
        {(
          ["ONLINE", "DEGRADED", "OFFLINE", "MAINTENANCE", "UNKNOWN"] as const
        ).map((status) => (
          <span
            className="bg-panel rounded-full border px-3 py-1.5 text-xs font-semibold"
            key={status}
          >
            {status}
          </span>
        ))}
      </div>
      <TopologyExplorer
        canSave={hasPermission(session.user.role, "SAVE_TOPOLOGY_POSITIONS")}
        initialSnapshot={snapshot}
      />
    </div>
  );
}
