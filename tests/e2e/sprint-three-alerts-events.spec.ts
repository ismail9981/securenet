import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const DEMO_PASSWORD = "SecureNetDemo123";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("all roles can browse filtered Alerts and immutable Events", async ({
  page,
}) => {
  await signIn(page, "viewer@securenet.demo");
  await page.goto("/alerts?severity=CRITICAL");
  await expect(
    page.getByRole("heading", { level: 1, name: "Alerts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Severity", exact: true }),
  ).toHaveValue("CRITICAL");
  await expect(
    page.getByText("Core router is offline").filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Acknowledge" })).toHaveCount(
    0,
  );

  await page.goto("/events?search=Alert");
  await expect(
    page.getByRole("heading", { level: 1, name: "Events" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Search event messages").filter({ visible: true }),
  ).toHaveValue("Alert");
  await expect(
    page.getByRole("list", { name: "Operational Event timeline" }),
  ).toBeVisible();
});

test("authorized operators see canonical lifecycle controls", async ({
  page,
}) => {
  await signIn(page, "admin@securenet.demo");
  await page.goto("/alerts?status=OPEN");
  const alert = page.locator("details:visible").filter({
    hasText: "Core router is offline",
  });
  await alert.locator("summary").click();
  await expect(
    alert.getByRole("button", { name: "Acknowledge" }),
  ).toBeVisible();
  await expect(alert.getByRole("button", { name: "Resolve" })).toBeVisible();
});

test("Alerts, Events, and related Device history pass axe", async ({
  page,
}) => {
  await signIn(page, "viewer@securenet.demo");
  for (const path of [
    "/alerts",
    "/events",
    "/devices/30000000-0000-4000-8000-000000000002",
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.filter(({ impact }) =>
        ["serious", "critical"].includes(impact ?? ""),
      ),
    ).toEqual([]);
  }
});
