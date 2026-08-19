import type { Metadata } from "next";

import { OperationalPageHeader } from "@/components/foundation/OperationalPageHeader";

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
      <OperationalPageHeader
        description="Explore active Devices and documented network connections. Links are visually undirected; capacity and connection editing remain unavailable."
        eyebrow="Network relationships"
        index="05"
        metadata={[
          { label: "Devices", value: snapshot.nodes.length },
          { label: "Links", value: snapshot.links.length },
          {
            label: "Layout",
            value: hasPermission(session.user.role, "SAVE_TOPOLOGY_POSITIONS")
              ? "EDITABLE"
              : "READ ONLY",
          },
          { label: "Source", value: "PERSISTED" },
        ]}
        title="Topology"
      />
      <div
        aria-label="Topology status legend"
        className="mb-6 flex flex-wrap gap-2"
      >
        {(
          ["ONLINE", "DEGRADED", "OFFLINE", "MAINTENANCE", "UNKNOWN"] as const
        ).map((status) => (
          <span
            className="bg-panel border px-3 py-1.5 font-mono text-[0.62rem] font-semibold"
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
