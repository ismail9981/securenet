import { describe, expect, it } from "vitest";

import {
  isPublicDemoRoleAllowed,
  validateProductionBootstrapEnvironment,
  validateRuntimeEnvironment,
} from "@/lib/runtime-environment";

const base = {
  AUTH_SECRET: "a".repeat(32),
  DATABASE_URL: "postgresql://user:password@localhost/securenet_dev",
  NODE_ENV: "development",
  SECURENET_DEPLOYMENT_ENV: "local",
};

describe("runtime environment validation", () => {
  it("accepts the local environment and all local Demo roles", () => {
    expect(validateRuntimeEnvironment(base).deploymentEnvironment).toBe(
      "local",
    );
    expect(isPublicDemoRoleAllowed("ADMIN", base)).toBe(true);
    expect(isPublicDemoRoleAllowed("NETWORK_ENGINEER", base)).toBe(true);
    expect(isPublicDemoRoleAllowed("VIEWER", base)).toBe(true);
  });

  it("rejects missing and short authentication secrets", () => {
    expect(() =>
      validateRuntimeEnvironment({ ...base, AUTH_SECRET: undefined }),
    ).toThrow();
    expect(() =>
      validateRuntimeEnvironment({ ...base, AUTH_SECRET: "too-short" }),
    ).toThrow();
  });

  it("allows only Viewer by default in production Demo", () => {
    const production = {
      ...base,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:password@host/securenet_prod_demo",
      SECURENET_DEPLOYMENT_ENV: "production-demo",
      SECURENET_PRODUCTION_DATABASE_NAME: "securenet_prod_demo",
      SEED_DEMO_PASSWORD: "production-demo-password",
    };
    expect(isPublicDemoRoleAllowed("VIEWER", production)).toBe(true);
    expect(isPublicDemoRoleAllowed("ADMIN", production)).toBe(false);
    expect(isPublicDemoRoleAllowed("NETWORK_ENGINEER", production)).toBe(false);
    expect(
      isPublicDemoRoleAllowed("ADMIN", {
        ...production,
        DEMO_PRIVATE_ROLE_LOGIN_ENABLED: "true",
      }),
    ).toBe(true);
  });

  it("rejects test variables and reserved databases in production Demo", () => {
    expect(() =>
      validateRuntimeEnvironment({
        ...base,
        NODE_ENV: "production",
        SECURENET_DEPLOYMENT_ENV: "production-demo",
        DATABASE_URL: "postgresql://user:password@host/securenet_test",
        SECURENET_PRODUCTION_DATABASE_NAME: "securenet_test",
        SEED_DEMO_PASSWORD: "production-demo-password",
      }),
    ).toThrow();
    expect(() =>
      validateRuntimeEnvironment({
        ...base,
        NODE_ENV: "production",
        SECURENET_DEPLOYMENT_ENV: "production-demo",
        DATABASE_URL: "postgresql://user:password@host/securenet_prod_demo",
        SECURENET_PRODUCTION_DATABASE_NAME: "securenet_prod_demo",
        SEED_DEMO_PASSWORD: "production-demo-password",
        TEST_DATABASE_URL: "postgresql://user:password@host/securenet_test",
      }),
    ).toThrow();
  });

  it("requires explicit bootstrap authorization and exact database identity", () => {
    const production = {
      ...base,
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:password@host/securenet_prod_demo",
      SECURENET_DEPLOYMENT_ENV: "production-demo",
      SECURENET_PRODUCTION_DATABASE_NAME: "securenet_prod_demo",
      SEED_DEMO_PASSWORD: "production-demo-password",
    };
    expect(() => validateProductionBootstrapEnvironment(production)).toThrow();
    expect(
      validateProductionBootstrapEnvironment({
        ...production,
        ALLOW_PRODUCTION_DEMO_BOOTSTRAP: "true",
      }),
    ).toEqual({ databaseName: "securenet_prod_demo" });
  });
});
