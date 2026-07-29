// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeviceMetricSnapshot } from "@/modules/inventory/presentation/DeviceMetricSnapshot";

describe("DeviceMetricSnapshot", () => {
  it("explains missing data without inventing zero values", () => {
    render(<DeviceMetricSnapshot snapshot={null} />);

    expect(
      screen.getByRole("heading", { name: "Current metrics unavailable" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No value has been inferred/)).toBeInTheDocument();
  });

  it("shows the latest snapshot, uptime, and stale disclosure", () => {
    render(
      <DeviceMetricSnapshot
        snapshot={{
          id: "1",
          cpuPct: 42,
          ramPct: 58,
          diskPct: 60,
          pingMs: 12,
          packetLossPct: 0.5,
          downloadMbps: 120,
          uploadMbps: 30,
          uptimeSeconds: 176_400,
          source: "SEED",
          simulationRunId: null,
          sourceTime: "2026-07-26T08:00:00.000Z",
          receivedAt: "2026-07-26T08:00:01.500Z",
          stale: true,
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Current metrics" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2d 1h")).toBeInTheDocument();
    expect(screen.getByText(/snapshot is stale/)).toBeInTheDocument();
    expect(
      screen.getByText(/Historical charts.*In Progress/),
    ).toBeInTheDocument();
  });
});
