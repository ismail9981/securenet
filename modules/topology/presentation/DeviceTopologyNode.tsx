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
      className={`bg-panel-raised focus-visible:ring-brand group relative min-w-40 border-l-2 px-3 py-2 text-left shadow-[0_8px_28px_rgb(0_0_0/28%)] focus-visible:ring-2 focus-visible:outline-none ${statusClass[data.status]} ${selected ? "ring-brand ring-1" : ""}`}
      type="button"
    >
      <Handle
        className="!border-0 !bg-transparent"
        isConnectable={false}
        position={Position.Top}
        type="target"
      />
      <div className="flex items-start gap-2">
        <Server
          aria-hidden="true"
          className="text-muted mt-0.5 size-4 transition-colors group-hover:text-[var(--accent-primary)]"
        />
        <div>
          <p className="max-w-34 truncate text-xs font-semibold">{data.name}</p>
          <p className="text-muted max-w-34 truncate text-[0.65rem]">
            {data.hostname}
          </p>
          <p className="mt-1 font-mono text-[0.58rem] font-semibold tracking-[0.04em]">
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
