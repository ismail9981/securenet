"use client";

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Server } from "lucide-react";

import type { TopologyNode } from "@/modules/topology/domain/topology";

const statusClass = {
  ONLINE: "border-success/60",
  DEGRADED: "border-warning/70",
  OFFLINE: "border-danger/70",
  MAINTENANCE: "border-info/70",
  UNKNOWN: "border-[var(--status-unknown)]",
} as const;

export function DeviceTopologyNode({
  data,
  selected,
}: NodeProps<Node<TopologyNode>>) {
  return (
    <button
      aria-label={`${data.name}, ${data.type}, ${data.status}`}
      className={`bg-panel-raised focus-visible:ring-brand min-w-40 rounded-xl border-2 px-3 py-2 text-left shadow-lg focus-visible:ring-2 focus-visible:outline-none ${statusClass[data.status]} ${selected ? "ring-brand ring-2" : ""}`}
      type="button"
    >
      <Handle
        className="!border-0 !bg-transparent"
        isConnectable={false}
        position={Position.Top}
        type="target"
      />
      <div className="flex items-start gap-2">
        <Server aria-hidden="true" className="text-brand mt-0.5 size-4" />
        <div>
          <p className="max-w-34 truncate text-xs font-semibold">{data.name}</p>
          <p className="text-muted max-w-34 truncate text-[0.65rem]">
            {data.hostname}
          </p>
          <p className="mt-1 text-[0.62rem] font-semibold">
            {data.type} · {data.status}
          </p>
        </div>
      </div>
      <Handle
        className="!border-0 !bg-transparent"
        isConnectable={false}
        position={Position.Bottom}
        type="source"
      />
    </button>
  );
}
