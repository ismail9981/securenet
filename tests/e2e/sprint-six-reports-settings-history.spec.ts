import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const password = "SecureNetDemo123";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("all roles can use the report, shared filters, CSV, and read-only settings", async ({
  page,
}) => {
  await signIn(page, "viewer@securenet.demo");
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Network Health Report" }),
  ).toBeVisible();
  await page.getByLabel("Severity").selectOption("CRITICAL");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/severity=CRITICAL/);
  const csv = await page.evaluate(async () => {
    const response = await fetch(
      "/api/v1/reports/alerts.csv?severity=CRITICAL",
    );
    return {
      status: response.status,
      type: response.headers.get("content-type"),
      disposition: response.headers.get("content-disposition"),
    };
  });
  expect(csv).toMatchObject({ status: 200, type: "text/csv; charset=utf-8" });
  expect(csv.disposition).toContain("securenet-alerts-");
  await page.goto("/settings");
  await expect(page.getByText(/Read-only settings access/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save global settings" }),
  ).toHaveCount(0);
});

test("Administrator manages bounded settings and persists Topology positions", async ({
  page,
}) => {
  await signIn(page, "admin@securenet.demo");
  await page.goto("/settings");
  await page.getByRole("button", { name: "Save global settings" }).click();
  await expect(page.getByText("Settings saved.")).toBeVisible();
  await expect(
    page
      .getByText(/AR-BW-01 remains disabled/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Enabled" }).first(),
  ).toBeDisabled();

  await page.goto("/topology");
  await page.getByRole("button", { name: "Save layout" }).click();
  await expect(page.getByText("Positions saved.")).toBeVisible();
  await page.reload();
  const positions = await page.evaluate(async () => {
    const response = await fetch("/api/v1/topology");
    const body = (await response.json()) as {
      data: { positions: unknown[] };
    };
    return body.data.positions.length;
  });
  expect(positions).toBeGreaterThan(0);
});

test("historical metrics are responsive, keyboard accessible, reduced-motion safe, and pass axe", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signIn(page, "engineer@securenet.demo");
  await page.goto("/devices/30000000-0000-4000-8000-000000000001");
  await expect(
    page.getByRole("heading", { name: "Metric history" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "7d" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "7d" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByText(/historical points loaded/)).toBeVisible();
  await page.getByText("Accessible metric table").click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("min-width", "320px");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.filter(({ impact }) =>
      ["serious", "critical"].includes(impact ?? ""),
    ),
  ).toEqual([]);
});
