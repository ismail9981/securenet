// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("recharts", () => ({
  CartesianGrid: () => null,
  Legend: () => null,
  Line: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

import { DeviceMetricHistory } from "@/modules/inventory/presentation/DeviceMetricHistory";

const metric = {
  id: "1",
  cpuPct: 10,
  ramPct: 20,
  diskPct: null,
  pingMs: 3,
  packetLossPct: 0,
  downloadMbps: 1000,
  uploadMbps: 500,
  uptimeSeconds: null,
  source: "AGGREGATED",
  simulationRunId: null,
  sourceTime: "2026-07-29T00:00:00.000Z",
  receivedAt: "2026-07-29T00:00:00.000Z",
  stale: false,
};

describe("DeviceMetricHistory", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads the default range and exposes keyboard range controls and table parity", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [metric] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <DeviceMetricHistory
        deviceId="30000000-0000-4000-8000-000000000001"
        timezone="Asia/Muscat"
        trafficUnit="Gbps"
      />,
    );
    await waitFor(() =>
      expect(screen.getByText(/1 historical points loaded/)).toBeVisible(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("range=24h"),
      expect.any(Object),
    );
    fireEvent.click(screen.getByRole("button", { name: "7d" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringContaining("range=7d"),
        expect.any(Object),
      ),
    );
    fireEvent.click(screen.getByText("Accessible metric table"));
    expect(screen.getByRole("table")).toBeVisible();
    expect(screen.getAllByText("1.00").length).toBeGreaterThan(0);
  });
});
