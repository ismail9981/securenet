import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const DEMO_ACCOUNTS = [
  {
    email: "admin@securenet.demo",
    password: "SecureNet-Demo-Admin-2026!",
    role: "ADMIN",
  },
  {
    email: "engineer@securenet.demo",
    password: "SecureNet-Demo-Engineer-2026!",
    role: "NETWORK_ENGINEER",
  },
  {
    email: "viewer@securenet.demo",
    password: "SecureNet-Demo-Viewer-2026!",
    role: "VIEWER",
  },
] as const;

async function signIn(
  page: Page,
  account: (typeof DEMO_ACCOUNTS)[number] = DEMO_ACCOUNTS[1],
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("redirects an unauthenticated protected request to the Demo login", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Monitor a simulated network environment",
    }),
  ).toBeVisible();
  await expect(page.getByText("Demo-only access")).toBeVisible();
});

test("rejects invalid credentials without revealing account existence", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("unknown@securenet.demo");
  await page.getByLabel("Password").fill("not-a-valid-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByText("The email or password is incorrect."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

for (const account of DEMO_ACCOUNTS) {
  test(`authenticates the deterministic ${account.role} account`, async ({
    page,
  }) => {
    await signIn(page, account);

    const response = await page.evaluate(async () => {
      const result = await fetch("/api/v1/auth/me");
      return {
        status: result.status,
        body: (await result.json()) as unknown,
      };
    });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: {
        user: {
          email: account.email,
          role: account.role,
        },
      },
    });
  });
}

test("renders the deterministic Dashboard and partial Health Score disclosure", async ({
  page,
}) => {
  await signIn(page);

  await expect(
    page.getByRole("heading", { level: 1, name: "Dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText("Demo · Simulated"),
  ).toBeVisible();
  await expect(page.getByText("Total devices").locator("..")).toContainText(
    "30",
  );
  await expect(
    page.getByText(/Formula incomplete: packet loss, ping/),
  ).toBeVisible();
  await expect(
    page.getByText(/No values on this page come from live monitoring/),
  ).toBeVisible();
});

test("supports protected navigation on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.locator('summary[aria-label="Toggle navigation"]').click();

  const navigation = page.getByRole("navigation", {
    name: "Mobile primary navigation",
  });
  await expect(navigation).toBeVisible();
  await navigation.getByRole("link", { name: "Devices" }).click();
  await expect(page).toHaveURL(/\/devices$/);
});

test("clears the Demo session on logout", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/login$/);
  const response = await page.request.get("/api/v1/auth/me");
  expect(response.status()).toBe(401);
});

test("has no serious or critical automated accessibility violations", async ({
  page,
}) => {
  await signIn(page);
  await expect(page).toHaveTitle("Dashboard | SecureNet");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blockingViolations = results.violations.filter(({ impact }) =>
    ["serious", "critical"].includes(impact ?? ""),
  );

  expect(blockingViolations).toEqual([]);
});
