// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PortfolioDemoDisclosure } from "@/components/foundation/PortfolioDemoDisclosure";

describe("PortfolioDemoDisclosure", () => {
  it("discloses the read-only free-hosting and no-worker limitations", () => {
    render(<PortfolioDemoDisclosure />);

    expect(
      screen.getByRole("complementary", {
        name: "Portfolio Demo disclosure",
      }),
    ).toHaveTextContent(/read-only public Viewer experience/i);
    expect(screen.getByText(/simulation worker is unavailable/i)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /start|simulate|cancel/i }),
    ).not.toBeInTheDocument();
  });
});
