// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HealthScorePanel } from "@/modules/monitoring/presentation/HealthScorePanel";

describe("HealthScorePanel", () => {
  it("exposes a textual score and incomplete-formula disclosure", () => {
    render(
      <HealthScorePanel
        health={{
          score: 79,
          label: "WARNING",
          formulaComplete: false,
          deductionTotal: 21,
          unresolvedFactors: [
            "AVERAGE_PACKET_LOSS",
            "AVERAGE_PING",
            "DEGRADED_DEVICE_RATIO",
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Network Health Score 79 out of 100, Warning",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Formula incomplete/)).toBeInTheDocument();
  });
});
