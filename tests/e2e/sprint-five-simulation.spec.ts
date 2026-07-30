import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const DEMO_PASSWORD = "SecureNetDemo123";
const webServerId = "30000000-0000-4000-8000-000000000011";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("Administrator starts, observes, and cancels a deterministic scenario", async ({
  page,
}) => {
  await signIn(page, "admin@securenet.demo");
  await expect(
    page.getByRole("heading", { name: "Simulate incident" }),
  ).toBeVisible();
  await page.getByLabel(/Web Server \(SRV-WEB-01\)/).check();
  await page.getByRole("button", { name: "Review and start" }).click();
  await expect(
    page.getByRole("dialog", { name: /Start Server CPU Overload/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Go back" })).toBeFocused();
  const startResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/v1/simulation/runs",
  );
  await page.getByRole("button", { name: "Start scenario" }).click();
  const started = await startResponse;
  expect(started.status()).toBe(201);
  const startedBody = (await started.json()) as { data: { id: string } };
  const runId = startedBody.data.id;
  await expect(page.getByText(/Server CPU Overload started/)).toBeVisible();
  await expect(page.getByRole("progressbar")).toBeVisible();

  let cancelled = false;
  try {
    await expect
      .poll(
        async () =>
          page.evaluate(async (id) => {
            const response = await fetch(`/api/v1/devices/${id}`);
            const result = (await response.json()) as {
              data?: {
                status: string;
                latestMetrics: {
                  simulationRunId: string | null;
                  source: string;
                } | null;
              };
            };
            return result.data;
          }, webServerId),
        { timeout: 15_000 },
      )
      .toMatchObject({
        status: "DEGRADED",
        latestMetrics: { simulationRunId: runId, source: "SIMULATION" },
      });

    const cancelResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname ===
          `/api/v1/simulation/runs/${runId}/cancel`,
    );
    await page.getByRole("button", { name: "Cancel scenario" }).click();
    expect((await cancelResponse).status()).toBe(200);
    cancelled = true;
    await expect(page.getByText("Scenario cancelled.")).toBeVisible();
    await expect(page.getByText(/^CANCELLED · \d+%$/)).toBeVisible();
  } finally {
    if (!cancelled) {
      const cleanup = await page.request.post(
        `/api/v1/simulation/runs/${runId}/cancel`,
      );
      expect(cleanup.status()).toBe(200);
    }
  }
});

test("Network Engineer and Viewer cannot see or invoke simulation controls", async ({
  page,
}) => {
  for (const email of ["engineer@securenet.demo", "viewer@securenet.demo"]) {
    await signIn(page, email);
    await expect(
      page.getByRole("heading", { name: "Simulate incident" }),
    ).toHaveCount(0);
    const response = await page.evaluate(async () => {
      const result = await fetch("/api/v1/simulation/runs", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": "browser-forbidden-001",
        },
        body: JSON.stringify({
          scenarioCode: "SIM-CPU-OVERLOAD",
          targetDeviceIds: ["30000000-0000-4000-8000-000000000011"],
        }),
      });
      return result.status;
    });
    expect(response).toBe(403);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
  }
});

test("Simulation control is keyboard accessible, reduced-motion safe, responsive, and passes axe", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signIn(page, "admin@securenet.demo");
  if (await page.getByRole("button", { name: "Cancel scenario" }).isVisible()) {
    await page.getByRole("button", { name: "Cancel scenario" }).click();
    await expect(page.getByText("Scenario cancelled.")).toBeVisible();
  }
  await expect(page.locator("html")).toHaveCSS("min-width", "320px");
  await page.getByLabel(/Web Server \(SRV-WEB-01\)/).focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Review and start" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Go back" })).toBeFocused();
  const duration = await page
    .getByRole("button", { name: "Go back" })
    .evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.filter(({ impact }) =>
      ["serious", "critical"].includes(impact ?? ""),
    ),
  ).toEqual([]);
});
