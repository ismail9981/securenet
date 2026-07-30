import { logEvent } from "../lib/logger";

const baseUrlValue = process.env.SMOKE_BASE_URL;
const password = process.env.SMOKE_DEMO_PASSWORD;
if (!baseUrlValue || !password) {
  throw new Error("Production smoke target and private password are required.");
}

const baseUrl = new URL(baseUrlValue);
if (
  baseUrl.protocol !== "https:" &&
  !["127.0.0.1", "localhost"].includes(baseUrl.hostname)
) {
  throw new Error("Production smoke tests require HTTPS.");
}

async function expectStatus(
  path: string,
  expected: number,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    ...init,
  });
  if (response.status !== expected) {
    throw new Error(`Smoke check failed for ${path}.`);
  }
  return response;
}

await expectStatus("/api/health/live", 200);
await expectStatus("/api/health/ready", 200);

const login = await expectStatus("/api/v1/auth/login", 200, {
  method: "POST",
  headers: { "content-type": "application/json", origin: baseUrl.origin },
  body: JSON.stringify({
    email: "viewer@securenet.demo",
    password,
  }),
});
const cookie = login.headers.get("set-cookie")?.split(";")[0];
if (!cookie) throw new Error("Viewer session cookie was not issued.");

for (const path of [
  "/dashboard",
  "/devices",
  "/alerts",
  "/events",
  "/topology",
  "/reports",
  "/settings",
  "/api/v1/reports/alerts.csv",
]) {
  await expectStatus(path, 200, { headers: { cookie } });
}

await expectStatus("/api/v1/simulation/runs", 403, {
  method: "POST",
  headers: {
    cookie,
    "content-type": "application/json",
    origin: baseUrl.origin,
    "idempotency-key": "production-smoke-viewer-denial",
  },
  body: JSON.stringify({
    scenarioCode: "CPU_OVERLOAD",
    targetDeviceIds: ["30000000-0000-4000-8000-000000000001"],
  }),
});

const controller = new AbortController();
const realtime = await fetch(new URL("/api/v1/realtime", baseUrl), {
  headers: { cookie, origin: baseUrl.origin },
  signal: controller.signal,
});
if (
  realtime.status !== 200 ||
  !realtime.headers.get("content-type")?.startsWith("text/event-stream")
) {
  throw new Error("Smoke check failed for realtime.");
}
controller.abort();

for (const email of ["admin@securenet.demo", "engineer@securenet.demo"]) {
  await expectStatus("/api/v1/auth/login", 401, {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseUrl.origin },
    body: JSON.stringify({ email, password }),
  });
}

logEvent("info", "production.smoke.completed", {
  authenticatedViewer: true,
  privateRolesRejected: true,
});
