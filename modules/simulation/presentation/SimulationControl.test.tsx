// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SimulationControl } from "@/modules/simulation/presentation/SimulationControl";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const targets = [
  {
    id: "30000000-0000-4000-8000-000000000008",
    name: "Application Server",
    hostname: "SRV-APP-01",
    type: "SERVER",
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    name: "Core Router",
    hostname: "RTR-CORE-01",
    type: "ROUTER",
  },
];

describe("SimulationControl", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.stubGlobal("crypto", { randomUUID: () => "request-id-1234" });
  });

  it("provides labeled scenario, target, confirmation, and start controls", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: "70000000-0000-4000-8000-000000000001",
          scenarioCode: "SIM-CPU-OVERLOAD",
          status: "RUNNING",
          targetDeviceIds: [targets[0]!.id],
          seed: 123456,
          engineVersion: 1,
          durationSeconds: 120,
          progress: 0,
          startedAt: "2026-07-27T00:00:00.000Z",
          endedAt: null,
          result: null,
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<SimulationControl initialRun={null} targets={targets} />);

    expect(
      screen.getByRole("heading", { name: "Simulate incident" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not monitor real Devices/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Application Server/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Core Router/)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/Application Server/));
    await user.click(screen.getByRole("button", { name: "Review and start" }));
    expect(
      screen.getByRole("dialog", { name: /Start Server CPU Overload/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go back" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Start scenario" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/simulation/runs",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Idempotency-Key": "request-id-1234",
        }),
      }),
    );
    expect(
      await screen.findByText("Server CPU Overload started."),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("shows no unsupported pause, resume, speed, or reset controls", () => {
    render(<SimulationControl initialRun={null} targets={targets} />);
    expect(screen.queryByText(/pause/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/resume/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/speed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reset/i)).not.toBeInTheDocument();
  });
});
