// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@xyflow/react", () => ({
  Background: () => null,
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom" },
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => children,
  ReactFlow: ({
    nodes,
    nodeTypes,
    onNodeClick,
    children,
  }: {
    nodes: Array<{ id: string; type: string; data: Record<string, unknown> }>;
    nodeTypes: Record<string, React.ComponentType<Record<string, unknown>>>;
    onNodeClick: (event: unknown, node: unknown) => void;
    children: React.ReactNode;
  }) => (
    <div data-testid="react-flow">
      {nodes.map((node) => (
        <button
          key={node.id}
          onClick={() => onNodeClick({}, node)}
          type="button"
        >
          {React.createElement(nodeTypes[node.type]!, {
            data: node.data,
            selected: false,
          })}
        </button>
      ))}
      {children}
    </div>
  ),
  useNodesState: (initial: unknown[]) => {
    const [nodes, setNodes] = React.useState(initial);
    return [nodes, setNodes, vi.fn()];
  },
}));

import type { TopologySnapshot } from "@/modules/topology/domain/topology";
import { TopologyExplorer } from "@/modules/topology/presentation/TopologyExplorer";

const snapshot: TopologySnapshot = {
  generatedAt: "2026-07-26T12:00:00.000Z",
  nodes: [
    {
      id: "30000000-0000-4000-8000-000000000001",
      name: "Security Firewall",
      hostname: "SEC-FW-01",
      type: "FIREWALL",
      status: "ONLINE",
    },
    {
      id: "30000000-0000-4000-8000-000000000002",
      name: "Core Router",
      hostname: "RTR-CORE-01",
      type: "ROUTER",
      status: "OFFLINE",
    },
  ],
  links: [
    {
      id: "60000000-0000-4000-8000-000000000001",
      sourceDeviceId: "30000000-0000-4000-8000-000000000001",
      targetDeviceId: "30000000-0000-4000-8000-000000000002",
      connectionType: "ETHERNET",
      label: null,
      bandwidthCapacityMbps: null,
      status: "DOWN",
    },
  ],
};

describe("TopologyExplorer", () => {
  afterEach(cleanup);

  it("renders React Flow and a complete accessible list with non-color status", () => {
    render(<TopologyExplorer initialSnapshot={snapshot} />);
    expect(screen.getByTestId("react-flow")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Accessible topology list" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("OFFLINE").length).toBeGreaterThan(0);
    expect(screen.getByText(/Connected Devices: RTR-CORE-01/)).toBeVisible();
    expect(screen.getByText(/Connected Devices: SEC-FW-01/)).toBeVisible();
  });

  it("opens a node summary with Device Details navigation", () => {
    render(<TopologyExplorer initialSnapshot={snapshot} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Core Router, ROUTER, OFFLINE/ }),
    );
    expect(
      screen.getByRole("heading", { name: "Core Router" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open Device Details" }),
    ).toHaveAttribute("href", "/devices/30000000-0000-4000-8000-000000000002");
  });
});
