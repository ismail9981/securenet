import type { Node } from "@xyflow/react";

import type { TopologyNode } from "@/modules/topology/domain/topology";

const TYPE_LEVEL: Readonly<Record<TopologyNode["type"], number>> = {
  FIREWALL: 0,
  ROUTER: 1,
  SWITCH: 2,
  SERVER: 3,
  NAS: 3,
  AP: 3,
  WORKSTATION: 4,
  PRINTER: 4,
};

const HORIZONTAL_GAP = 220;
const VERTICAL_GAP = 150;

export function deterministicTopologyLayout(
  topologyNodes: readonly TopologyNode[],
): readonly Node<TopologyNode>[] {
  const levels = new Map<number, TopologyNode[]>();
  for (const node of topologyNodes) {
    const level = TYPE_LEVEL[node.type];
    const group = levels.get(level) ?? [];
    group.push(node);
    levels.set(level, group);
  }

  return [...levels.entries()]
    .sort(([left], [right]) => left - right)
    .flatMap(([level, nodes]) =>
      nodes
        .sort(
          (left, right) =>
            left.hostname.localeCompare(right.hostname) ||
            left.id.localeCompare(right.id),
        )
        .map((node, index) => ({
          id: node.id,
          type: "device",
          position: {
            x:
              index * HORIZONTAL_GAP -
              ((nodes.length - 1) * HORIZONTAL_GAP) / 2,
            y: level * VERTICAL_GAP,
          },
          data: node,
        })),
    );
}
