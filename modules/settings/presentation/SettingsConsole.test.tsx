// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SettingsConsole } from "@/modules/settings/presentation/SettingsConsole";

const settings = {
  timezone: "Asia/Muscat" as const,
  cpuUnit: "percent" as const,
  memoryUnit: "percent" as const,
  trafficUnit: "Mbps" as const,
  updatedAt: "2026-07-29T00:00:00.000Z",
};
const rules = [
  {
    id: "40000000-0000-4000-8000-000000000007",
    code: "AR-BW-01",
    name: "Bandwidth",
    metric: "BANDWIDTH",
    operator: "GTE",
    warningThreshold: 90,
    criticalThreshold: null,
    durationSeconds: 0,
    consecutiveSamples: null,
    enabled: false,
  },
];

describe("SettingsConsole RBAC UX", () => {
  afterEach(cleanup);

  it("shows a clear read-only state without mutation controls", () => {
    render(
      <SettingsConsole
        canManage={false}
        initialRules={[]}
        initialSettings={settings}
      />,
    );
    expect(screen.getByText(/Read-only settings access/)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Save global settings" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the bandwidth rule visibly disabled for Administrators", () => {
    render(
      <SettingsConsole
        canManage
        initialRules={rules}
        initialSettings={settings}
      />,
    );
    expect(screen.getByRole("checkbox", { name: "Enabled" })).toBeDisabled();
    expect(screen.getByText(/AR-BW-01 remains disabled/)).toBeVisible();
  });
});
