import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const DEMO_PASSWORD = "SecureNetDemo123";
const accounts = {
  admin: "admin@securenet.demo",
  engineer: "engineer@securenet.demo",
  viewer: "viewer@securenet.demo",
} as const;

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

for (const [role, email] of Object.entries(accounts)) {
  test(`${role} can search inventory and open current device details`, async ({
    page,
  }) => {
    await signIn(page, email);
    await page.goto("/devices");
    await page
      .getByRole("searchbox", { name: "Search", exact: true })
      .fill("10.20.0.2");
    await page.getByRole("button", { name: "Apply" }).click();

    const coreRouterLink = page.locator(
      'a[href="/devices/30000000-0000-4000-8000-000000000002"]:visible',
    );
    await expect(coreRouterLink).toBeVisible();
    await coreRouterLink.click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Core Router" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Current metrics" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Metric history" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Overview" }).getByText("Active alerts"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Related alerts" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Related events" }),
    ).toBeVisible();
  });
}

test("filters, sorts, and paginates active device inventory", async ({
  page,
}) => {
  await signIn(page, accounts.engineer);
  await page.goto("/devices?type=WORKSTATION&sort=ping&order=desc&pageSize=10");

  await expect(
    page.getByText(/active devices/).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Status", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByRole("combobox", { name: "Type", exact: true }),
  ).toHaveValue("WORKSTATION");
  await expect(
    page.getByRole("combobox", { name: "Sort", exact: true }),
  ).toHaveValue("ping");
  await expect(
    page.getByRole("combobox", { name: "Order", exact: true }),
  ).toHaveValue("desc");
  await expect(page.getByRole("link", { name: "Next" })).toBeVisible();
});

for (const [role, email] of [
  ["engineer", accounts.engineer],
  ["viewer", accounts.viewer],
] as const) {
  test(`${role} remains read-only in UI and direct API calls`, async ({
    page,
  }) => {
    await signIn(page, email);
    await page.goto("/devices");

    await expect(
      page
        .getByRole("main")
        .getByText(
          new RegExp(
            `${role === "engineer" ? "network engineer" : "viewer"} account has read-only`,
          ),
        ),
    ).toBeVisible();
    await expect(page.getByText("Add device", { exact: true })).toHaveCount(0);

    const result = await page.evaluate(async () => {
      const response = await fetch("/api/v1/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Forbidden Browser Device",
          hostname: "FORBIDDEN-BROWSER-01",
          ipAddress: "10.99.8.8",
          type: "SERVER",
          status: "UNKNOWN",
          locationId: "10000000-0000-4000-8000-000000000001",
          importanceWeight: 1,
        }),
      });
      return { status: response.status, body: await response.json() };
    });

    expect(result.status).toBe(403);
    expect(result.body).toMatchObject({
      error: { code: "AUTH_FORBIDDEN" },
    });
  });
}

test("Administrator creates, updates, and confirms soft archive", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name.includes("mobile");
  const suffix = mobile ? "MOB" : "DESK";
  const hostname = `SRV-E2E-${suffix}`;
  const ipAddress = mobile ? "10.99.9.21" : "10.99.9.20";

  await signIn(page, accounts.admin);
  await page.goto("/devices");
  const addPanel = page
    .locator("details:visible")
    .filter({ hasText: "Add device" });
  await addPanel.locator("summary").click();
  await addPanel.getByLabel("Device name").fill(`E2E ${suffix} Server`);
  await addPanel.getByLabel("Hostname").fill(hostname);
  await addPanel.getByLabel("IP address").fill(ipAddress);
  await addPanel.getByLabel("Type").selectOption("SERVER");
  await addPanel.getByLabel("Status").selectOption("UNKNOWN");
  await addPanel
    .getByLabel("Location")
    .selectOption("10000000-0000-4000-8000-000000000001");
  await addPanel.getByRole("button", { name: "Add device" }).click();

  await expect(page).toHaveURL(/\/devices\/[0-9a-f-]+$/);
  await expect(
    page.getByRole("heading", { level: 1, name: `E2E ${suffix} Server` }),
  ).toBeVisible();

  const currentMain = page.locator("main:visible").last();
  const editPanel = currentMain
    .locator("details:visible")
    .filter({ hasText: "Edit device" });
  await editPanel.locator("summary").press("Enter");
  await editPanel
    .getByLabel("Device name")
    .fill(`Updated E2E ${suffix} Server`);
  await editPanel.getByRole("button", { name: "Save changes" }).press("Enter");
  await expect(
    page.getByText("Device changes saved and audited."),
  ).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Archive device" })
    .filter({ visible: true })
    .press("Enter");
  await expect(page).toHaveURL(/\/devices(?:\?.*)?$/);

  await page
    .getByRole("searchbox", { name: "Search", exact: true })
    .fill(hostname);
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(
    page.getByRole("heading", { name: "No devices found" }),
  ).toBeVisible();
});

test("renders device not-found state for a missing identifier", async ({
  page,
}) => {
  await signIn(page, accounts.viewer);
  await page.goto("/devices/30000000-0000-4000-8000-999999999999");

  await expect(page.getByText("404 · Not found")).toBeVisible();
});

test("device list and details have no serious accessibility violations", async ({
  page,
}) => {
  await signIn(page, accounts.viewer);

  for (const path of [
    "/devices",
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
