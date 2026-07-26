import { randomBytes } from "node:crypto";

import { config } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

config({ path: ".env.local", quiet: true });

const authSecret =
  process.env.AUTH_SECRET ?? randomBytes(32).toString("base64url");
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (
  !testDatabaseUrl ||
  new URL(testDatabaseUrl).pathname.replace(/^\/+/, "") !== "securenet_test"
) {
  throw new Error(
    "TEST_DATABASE_URL must target securenet_test before Playwright can run.",
  );
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run db:test:reset && npm run start -- --port 3100",
    env: {
      AUTH_SECRET: authSecret,
      DATABASE_URL: testDatabaseUrl,
      SEED_DEMO_PASSWORD: "SecureNetDemo123",
    },
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
