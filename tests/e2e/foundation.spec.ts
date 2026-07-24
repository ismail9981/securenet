import { expect, test } from "@playwright/test";

test("shows the Sprint 0 dashboard shell and simulation disclosure", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { level: 1, name: "Dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Demo · Simulated")).toBeVisible();
  await expect(page.getByText("Sprint 0 foundation placeholder")).toBeVisible();
});

test("keeps P0 navigation available on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/devices");
  await page.locator('summary[aria-label="Toggle navigation"]').click();

  await expect(
    page.getByRole("navigation", { name: "Mobile primary navigation" }),
  ).toBeVisible();
});
