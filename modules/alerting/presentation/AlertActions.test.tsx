// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AlertRecord } from "@/modules/alerting/application/alert-contracts";
import { AlertActions } from "@/modules/alerting/presentation/AlertActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

afterEach(cleanup);

const alert: AlertRecord = {
  id: "50000000-0000-4000-8000-000000000001",
  device: {
    id: "30000000-0000-4000-8000-000000000002",
    name: "Core Router",
    hostname: "RTR-CORE-01",
    archived: false,
  },
  alertRule: {
    id: "40000000-0000-4000-8000-000000000006",
    code: "AR-OFFLINE-01",
    name: "Device offline",
  },
  title: "Core router is offline",
  description: "Offline condition.",
  severity: "CRITICAL",
  status: "OPEN",
  source: "DEVICE_STATUS",
  openedAt: "2026-07-26T10:00:00.000Z",
  lastTriggeredAt: "2026-07-26T10:01:00.000Z",
  acknowledgedAt: null,
  acknowledgedBy: null,
  acknowledgementNote: null,
  assignee: null,
  resolvedAt: null,
  resolvedBy: null,
  resolutionNote: null,
};

describe("AlertActions", () => {
  it("shows Administrator open-Alert controls", () => {
    render(<AlertActions alert={alert} role="ADMIN" />);
    expect(
      screen.getByRole("button", { name: "Acknowledge" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resolve" })).toBeInTheDocument();
  });

  it("enforces Viewer read-only and hides archived controls", () => {
    const { rerender } = render(<AlertActions alert={alert} role="VIEWER" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(
      <AlertActions
        alert={{ ...alert, device: { ...alert.device, archived: true } }}
        role="ADMIN"
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
