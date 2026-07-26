import { describe, expect, it } from "vitest";

import type { TopologyNode } from "@/modules/topology/domain/topology";
import { deterministicTopologyLayout } from "@/modules/topology/presentation/topology-layout";

const nodes: TopologyNode[] = [
  {
    id: "30000000-0000-4000-8000-000000000002",
    name: "Router",
    hostname: "RTR-01",
    type: "ROUTER",
    status: "ONLINE",
  },
  {
    id: "30000000-0000-4000-8000-000000000001",
    name: "Firewall",
    hostname: "FW-01",
    type: "FIREWALL",
    status: "ONLINE",
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    name: "Orphan server",
    hostname: "SRV-01",
    type: "SERVER",
    status: "UNKNOWN",
  },
];

describe("deterministic topology layout", () => {
  it("returns identical positions for equal data regardless of input order", () => {
    const first = deterministicTopologyLayout(nodes);
    const second = deterministicTopologyLayout([...nodes].reverse());
    expect(second).toEqual(first);
  });

  it("places firewall, routing, and endpoint tiers in stable vertical order", () => {
    const positioned = deterministicTopologyLayout(nodes);
    const y = Object.fromEntries(
      positioned.map((node) => [node.data.type, node.position.y]),
    );
    expect(y.FIREWALL!).toBeLessThan(y.ROUTER!);
    expect(y.ROUTER!).toBeLessThan(y.SERVER!);
  });
});
