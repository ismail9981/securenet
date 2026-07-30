// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/modules/identity/presentation/LoginForm";
import { DEMO_ACCOUNTS } from "@/modules/identity/infrastructure/demo-accounts";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("LoginForm", () => {
  it("provides labeled credentials fields and all three Demo roles", () => {
    render(
      <LoginForm
        demoAccounts={DEMO_ACCOUNTS}
        demoPassword="SecureNetDemo123"
      />,
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByText("Network Engineer")).toBeInTheDocument();
    expect(screen.getByText("Viewer")).toBeInTheDocument();
    expect(screen.getByText("SecureNetDemo123")).toBeInTheDocument();
  });
});
