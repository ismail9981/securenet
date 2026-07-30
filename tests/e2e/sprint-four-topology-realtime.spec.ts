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

test("Viewer can inspect the active topology and navigate by node", async ({
  page,
}) => {
  await signIn(page, "viewer@securenet.demo");
  await page.goto("/topology");
  const topology = page.getByRole("main");
  await expect(
    topology.getByRole("heading", { level: 1, name: "Topology" }),
  ).toBeVisible();
  await expect(topology.getByText("30 Devices · 29 links")).toBeVisible();
  await expect(
    topology.getByRole("heading", { name: "Accessible topology list" }),
  ).toBeVisible();
  await expect(
    topology.getByText(/Connected Devices:/).first(),
  ).toBeVisible();

  await topology
    .locator(".react-flow__node")
    .filter({ hasText: "Core Router" })
    .click();
  await expect(
    topology.getByRole("heading", { name: "Core Router" }),
  ).toBeVisible();
  await topology.getByRole("link", { name: "Open Device Details" }).click();
  await expect(page).toHaveURL(
    /\/devices\/30000000-0000-4000-8000-000000000002$/,
  );
});

test("Topology is keyboard usable, responsive, reduced-motion safe, and passes axe", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signIn(page, "engineer@securenet.demo");
  await page.goto("/topology");
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset" })).toBeVisible();
  await page.getByRole("button", { name: "Fit" }).focus();
  await expect(page.getByRole("button", { name: "Fit" })).toBeFocused();
  await expect(page.locator("html")).toHaveCSS("min-width", "320px");

  const reducedDuration = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector("button")!).transitionDuration,
  );
  expect(Number.parseFloat(reducedDuration)).toBeLessThanOrEqual(0.001);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.filter(({ impact }) =>
      ["serious", "critical"].includes(impact ?? ""),
    ),
  ).toEqual([]);
});

test("Device commits update Topology without reload and preserve archive semantics", async ({
  page,
}) => {
  await signIn(page, "admin@securenet.demo");
  await page.goto("/topology");
  await expect(page.getByTitle(/Realtime connection: Connected/)).toBeVisible();

  const created = await page.evaluate(async () => {
    const response = await fetch("/api/v1/devices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Realtime Orphan",
        hostname: "RT-ORPHAN-01",
        ipAddress: "10.99.90.1",
        type: "SERVER",
        status: "ONLINE",
        locationId: "10000000-0000-4000-8000-000000000001",
        importanceWeight: 1,
      }),
    });
    return (await response.json()).data as { id: string };
  });

  await expect(page.getByRole("link", { name: "Realtime Orphan" })).toBeVisible(
    { timeout: 5_000 },
  );
  await expect(page.getByText(/Connected Devices: None/).last()).toBeVisible();

  await page.evaluate(async (id) => {
    await fetch(`/api/v1/devices/${id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmed: true }),
    });
  }, created.id);
  await expect(page.getByRole("link", { name: "Realtime Orphan" })).toHaveCount(
    0,
    { timeout: 5_000 },
  );
});

test("Alert and Event consumers refresh from committed realtime signals", async ({
  page,
}, testInfo) => {
  await signIn(page, "admin@securenet.demo");
  await page.goto("/alerts");
  await expect(page.getByTitle(/Realtime connection: Connected/)).toBeVisible();

  const fixtureByProject = {
    "desktop-chromium": {
      id: "50000000-0000-4000-8000-000000000002",
      title: "Application server CPU threshold exceeded",
      eventText: /Application server CPU threshold exceeded|CPU Alert/,
    },
    "mobile-chromium": {
      id: "50000000-0000-4000-8000-000000000003",
      title: "Access point packet loss was critical",
      eventText: /packet.loss Alert|wireless interference/i,
    },
    "desktop-webkit": {
      id: "50000000-0000-4000-8000-000000000002",
      title: "Application server CPU threshold exceeded",
      eventText: /Application server CPU threshold exceeded|CPU Alert/,
    },
  } as const;
  const fixture =
    fixtureByProject[testInfo.project.name as keyof typeof fixtureByProject] ??
    fixtureByProject["desktop-chromium"];
  const alertId = fixture.id;
  const result = await page.evaluate(async (id) => {
    const current = await fetch(`/api/v1/alerts/${id}`).then(
      async (response) => (await response.json()).data as { status: string },
    );
    const command =
      current.status === "ACKNOWLEDGED"
        ? "investigate"
        : current.status === "INVESTIGATING"
          ? "resolve"
          : "acknowledge";
    const response = await fetch(`/api/v1/alerts/${id}/${command}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    return (await response.json()).data as {
      alert: { status: string };
      eventId: string;
    };
  }, alertId);

  const cpuAlert = page.locator("details:visible").filter({
    hasText: fixture.title,
  });
  await expect(cpuAlert).toContainText(result.alert.status, { timeout: 5_000 });

  await page.goto("/events");
  await expect(page.getByText(fixture.eventText).first()).toBeVisible();

  const eventProbe = await page.evaluate(async () => {
    const response = await fetch("/api/v1/devices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Event Realtime Probe",
        hostname: "RT-EVENT-01",
        ipAddress: "10.99.91.1",
        type: "SERVER",
        status: "UNKNOWN",
        locationId: "10000000-0000-4000-8000-000000000001",
        importanceWeight: 1,
      }),
    });
    return (await response.json()).data as { id: string };
  });
  await expect(
    page.getByText(/created Event Realtime Probe/).first(),
  ).toBeVisible({ timeout: 5_000 });
  await page.evaluate(async (id) => {
    await fetch(`/api/v1/devices/${id}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmed: true }),
    });
  }, eventProbe.id);
});
