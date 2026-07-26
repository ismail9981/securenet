"use client";

import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { RealtimeEnvelope } from "@/modules/realtime/application/realtime-contracts";
import {
  connectedDeviceIds,
  topologySnapshotSchema,
  type TopologyNode,
  type TopologySnapshot,
} from "@/modules/topology/domain/topology";
import { DeviceTopologyNode } from "@/modules/topology/presentation/DeviceTopologyNode";
import { deterministicTopologyLayout } from "@/modules/topology/presentation/topology-layout";

const nodeTypes = { device: DeviceTopologyNode };
type DeviceFlowNode = Node<TopologyNode>;

const edgeColor = {
  ACTIVE: "var(--status-success)",
  DEGRADED: "var(--status-warning)",
  DOWN: "var(--status-danger)",
} as const;

function TopologyCanvas({
  initialSnapshot,
}: {
  readonly initialSnapshot: TopologySnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const initialNodes = useMemo(
    () => [...deterministicTopologyLayout(snapshot.nodes)],
    [snapshot.nodes],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [instance, setInstance] = useState<ReactFlowInstance<
    DeviceFlowNode,
    Edge
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = (event?: Event) => {
      const envelope = (event as CustomEvent<RealtimeEnvelope> | undefined)
        ?.detail;
      if (envelope && envelope.eventType !== "device.updated") return;
      void fetch("/api/v1/topology", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Topology refresh failed.");
          const body = (await response.json()) as { data?: unknown };
          return topologySnapshotSchema.parse(body.data);
        })
        .then((next) => {
          if (!cancelled) {
            setSnapshot(next);
            setNodes([...deterministicTopologyLayout(next.nodes)]);
          }
        })
        .catch(() => {
          // Conditional polling and reconnect snapshot recovery remain available.
        });
    };
    window.addEventListener("securenet:realtime", refresh);
    window.addEventListener("securenet:snapshot-recovery", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("securenet:realtime", refresh);
      window.removeEventListener("securenet:snapshot-recovery", refresh);
    };
  }, [setNodes]);

  const edges = useMemo<readonly Edge[]>(
    () =>
      snapshot.links.map((link) => ({
        id: link.id,
        source: link.sourceDeviceId,
        target: link.targetDeviceId,
        label: `${link.connectionType} · ${link.status}`,
        style: { stroke: edgeColor[link.status], strokeWidth: 2 },
        labelStyle: { fill: "var(--text-secondary)", fontSize: 10 },
      })),
    [snapshot.links],
  );
  const selected = snapshot.nodes.find((node) => node.id === selectedId);
  const nodeById = new Map(snapshot.nodes.map((node) => [node.id, node]));

  if (!snapshot.nodes.length) {
    return (
      <section className="bg-panel rounded-xl border p-8 text-center">
        <h2 className="font-semibold">No active Devices in Topology</h2>
        <p className="text-muted mt-2 text-sm">
          Active Devices appear here when persisted inventory is available.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section
        aria-label="Interactive network topology"
        className="bg-panel overflow-hidden rounded-xl border"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
          <div>
            <h2 className="font-semibold">Interactive graph</h2>
            <p className="text-muted text-xs">
              {snapshot.nodes.length} Devices · {snapshot.links.length} links
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Topology controls">
            <button
              aria-label="Zoom in"
              className="bg-panel-raised grid min-h-11 min-w-11 place-items-center rounded-lg border"
              onClick={() => void instance?.zoomIn({ duration: 200 })}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
            <button
              aria-label="Zoom out"
              className="bg-panel-raised grid min-h-11 min-w-11 place-items-center rounded-lg border"
              onClick={() => void instance?.zoomOut({ duration: 200 })}
              type="button"
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <button
              className="bg-panel-raised flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm"
              onClick={() => void instance?.fitView({ duration: 200 })}
              type="button"
            >
              <Maximize2 aria-hidden="true" className="size-4" />
              Fit
            </button>
            <button
              className="bg-panel-raised flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm"
              onClick={() => {
                setNodes([...deterministicTopologyLayout(snapshot.nodes)]);
                void instance?.fitView({ duration: 200 });
              }}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Reset
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="h-[34rem] min-w-[48rem] sm:min-w-0">
            <ReactFlow
              edges={[...edges]}
              fitView
              maxZoom={1.8}
              minZoom={0.2}
              nodeTypes={nodeTypes}
              nodes={nodes}
              nodesConnectable={false}
              onInit={setInstance}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              onNodesChange={onNodesChange}
            >
              <Background color="var(--border-subtle)" gap={24} />
            </ReactFlow>
          </div>
        </div>
      </section>

      {selected ? (
        <section aria-live="polite" className="bg-panel rounded-xl border p-5">
          <p className="text-brand text-xs font-semibold uppercase">
            Device summary
          </p>
          <h2 className="mt-2 text-lg font-semibold">{selected.name}</h2>
          <p className="text-muted mt-1 text-sm">
            {selected.hostname} · {selected.type} · {selected.status}
          </p>
          <Link
            className="bg-brand mt-4 inline-flex min-h-11 items-center rounded-lg px-4 font-semibold text-slate-950"
            href={`/devices/${selected.id}`}
          >
            Open Device Details
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="topology-list-title">
        <h2 className="text-lg font-semibold" id="topology-list-title">
          Accessible topology list
        </h2>
        <p className="text-muted mt-1 text-sm">
          Complete text alternative for every active Device and connection.
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {snapshot.nodes.map((node) => {
            const connected = connectedDeviceIds(node.id, snapshot.links)
              .map((id) => nodeById.get(id)?.hostname)
              .filter((hostname): hostname is string => Boolean(hostname));
            return (
              <li className="bg-panel rounded-xl border p-4" key={node.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      className="font-semibold hover:underline"
                      href={`/devices/${node.id}`}
                    >
                      {node.name}
                    </Link>
                    <p className="text-muted text-sm">{node.hostname}</p>
                  </div>
                  <span className="bg-panel-raised rounded-full border px-2.5 py-1 text-xs font-semibold">
                    {node.status}
                  </span>
                </div>
                <p className="text-muted mt-3 text-xs">
                  Type: {node.type}. Connected Devices:{" "}
                  {connected.length ? connected.join(", ") : "None"}.
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export function TopologyExplorer({
  initialSnapshot,
}: {
  readonly initialSnapshot: TopologySnapshot;
}) {
  return (
    <ReactFlowProvider>
      <TopologyCanvas
        initialSnapshot={initialSnapshot}
        key={initialSnapshot.generatedAt}
      />
    </ReactFlowProvider>
  );
}
