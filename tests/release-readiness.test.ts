import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("release configuration audit", () => {
  it("defines one Web and one Worker with manual Render deployment", () => {
    const blueprint = source("render.yaml");
    expect(blueprint.match(/type: web/g)).toHaveLength(1);
    expect(blueprint.match(/type: worker/g)).toHaveLength(1);
    expect(blueprint.match(/numInstances: 1/g)).toHaveLength(2);
    expect(blueprint.match(/autoDeployTrigger: off/g)).toHaveLength(2);
    expect(
      blueprint.match(/preDeployCommand: npm run db:migrate:deploy/g),
    ).toHaveLength(1);
    expect(blueprint).toContain("healthCheckPath: /api/health/ready");
    expect(blueprint).toContain("plan: basic-256mb");
    expect(blueprint).not.toMatch(
      /postgres(?:ql)?:\/\/|SecureNetDemo123|AUTH_SECRET:\s+\S+/,
    );
  });

  it("keeps deployment manual after PR/main validation", () => {
    const workflow = source(".github/workflows/ci.yml");
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("push:");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("environment:");
    expect(workflow).not.toMatch(/render\.com|deploy hook|curl\s+.*deploy/i);
  });

  it("defines a separate free portfolio Web Service without paid resources or secrets", () => {
    const blueprint = source("render.portfolio.yaml");
    expect(blueprint.match(/type: web/g)).toHaveLength(1);
    expect(blueprint).toContain("plan: free");
    expect(blueprint).toContain("branch: main");
    expect(blueprint).toContain("healthCheckPath: /api/health/ready");
    expect(blueprint).toContain("SECURENET_PORTFOLIO_MODE");
    expect(blueprint).toContain("DATABASE_URL");
    expect(blueprint).not.toMatch(
      /type:\s+(?:worker|pserv|cron)|^databases:|redis|disk:|plan:\s+(?:starter|standard|pro)|postgres(?:ql)?:\/\/|SecureNetDemo123/im,
    );
    expect(blueprint).not.toContain("db:portfolio:bootstrap");
    expect(blueprint).not.toContain("db:migrate:deploy");
  });

  it("preserves the approved paid production Render Blueprint byte-for-byte", () => {
    expect(
      createHash("sha256").update(source("render.yaml")).digest("hex"),
    ).toBe("dcb7fc369952364f77b090ec8f5563e9456d8ae8c66d04a46ce637ab889baef8");
  });

  it("keeps Portfolio simulation controls unavailable without removing production controls", () => {
    expect(source("app/(operations)/dashboard/page.tsx")).toContain(
      'session.user.role === "ADMIN" && !portfolioMode',
    );
    expect(source("render.yaml")).toContain("type: worker");
    expect(source("render.portfolio.yaml")).not.toContain("type: worker");
  });

  it("keeps private Demo identities out of the client LoginForm module", () => {
    const loginForm = source("modules/identity/presentation/LoginForm.tsx");
    expect(loginForm).not.toContain("admin@securenet.demo");
    expect(loginForm).not.toContain("engineer@securenet.demo");
    expect(loginForm).not.toContain("DEMO_ACCOUNTS");
  });

  it("handles SIGINT and SIGTERM in both persistent processes", () => {
    for (const file of [
      "scripts/start-web.ts",
      "scripts/simulation-worker.ts",
    ]) {
      expect(source(file), file).toContain('"SIGINT"');
      expect(source(file), file).toContain('"SIGTERM"');
      expect(source(file), file).toMatch(/stopping/);
    }
  });

  it("keeps every visible operational Device reference navigable", () => {
    for (const file of [
      "modules/inventory/presentation/DeviceList.tsx",
      "modules/alerting/presentation/AlertList.tsx",
      "modules/event-log/presentation/EventTimeline.tsx",
      "modules/topology/presentation/TopologyExplorer.tsx",
    ]) {
      expect(source(file), file).toContain("/devices/");
      expect(source(file), file).toContain("href=");
    }
  });

  it("preserves disabled bandwidth alerting and no automatic resolution", () => {
    const seed = source("prisma/seed.ts");
    const bandwidthRule = seed.slice(seed.indexOf('code: "AR-BW-01"'));
    expect(bandwidthRule.slice(0, 600)).toContain("enabled: false");
    expect(source("scripts/simulation-worker.ts")).not.toMatch(
      /auto.?resolve/i,
    );
  });

  it("does not add forbidden deployment or product files", () => {
    const packageSource = source("package.json");
    expect(packageSource).not.toMatch(/sentry|datadog|redis|bullmq/i);
    expect(() => source("Dockerfile")).toThrow();
    expect(() => source("vercel.json")).toThrow();
  });
});
