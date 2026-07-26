// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DeviceForm } from "@/modules/inventory/presentation/DeviceForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("DeviceForm", () => {
  it("provides labeled Administrator device fields", () => {
    render(
      <DeviceForm
        locations={[
          {
            id: "10000000-0000-4000-8000-000000000001",
            name: "Muscat Operations Center",
          },
        ]}
        mode="create"
        parents={[]}
      />,
    );

    expect(screen.getByLabelText("Device name")).toBeInTheDocument();
    expect(screen.getByLabelText("Hostname")).toBeInTheDocument();
    expect(screen.getByLabelText("IP address")).toBeInTheDocument();
    expect(screen.getByLabelText("Location")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add device" }),
    ).toBeInTheDocument();
  });
});
