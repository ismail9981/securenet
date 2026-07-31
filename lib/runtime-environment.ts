import { z } from "zod";

const deploymentEnvironmentSchema = z.enum([
  "local",
  "test",
  "production-demo",
]);

const runtimeEnvironmentSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url().refine(isPostgresUrl),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SECURENET_DEPLOYMENT_ENV: deploymentEnvironmentSchema.default("local"),
  SECURENET_PORTFOLIO_MODE: z.enum(["true", "false"]).default("false"),
  DEMO_PRIVATE_ROLE_LOGIN_ENABLED: z.enum(["true", "false"]).default("false"),
  SEED_DEMO_PASSWORD: z.string().min(12).max(200).optional(),
});

export type DeploymentEnvironment = z.infer<typeof deploymentEnvironmentSchema>;

export interface RuntimeEnvironment {
  readonly deploymentEnvironment: DeploymentEnvironment;
  readonly portfolioMode: boolean;
  readonly privateRoleLoginEnabled: boolean;
  readonly logLevel: "debug" | "info" | "warn" | "error";
}

function isPostgresUrl(value: string): boolean {
  try {
    return ["postgres:", "postgresql:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function databaseName(value: string): string {
  return decodeURIComponent(new URL(value).pathname.replace(/^\/+/, ""));
}

function isReservedDatabaseName(value: string): boolean {
  return (
    value === "securenet_dev" ||
    value === "securenet_test" ||
    value === "postgres" ||
    value.startsWith("template")
  );
}

export function validateRuntimeEnvironment(
  source: Readonly<Record<string, string | undefined>> = process.env,
): RuntimeEnvironment {
  const parsed = runtimeEnvironmentSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error("Required runtime environment configuration is invalid.");
  }

  const deploymentEnvironment = parsed.data.SECURENET_DEPLOYMENT_ENV;
  const portfolioMode = parsed.data.SECURENET_PORTFOLIO_MODE === "true";
  if (deploymentEnvironment === "production-demo") {
    const actualDatabaseName = databaseName(parsed.data.DATABASE_URL);
    if (
      source.NODE_ENV !== "production" ||
      source.TEST_DATABASE_URL ||
      !parsed.data.SEED_DEMO_PASSWORD ||
      !source.SECURENET_PRODUCTION_DATABASE_NAME ||
      source.SECURENET_PRODUCTION_DATABASE_NAME !== actualDatabaseName ||
      isReservedDatabaseName(actualDatabaseName)
    ) {
      throw new Error("Production Demo environment configuration is unsafe.");
    }
  }
  if (
    portfolioMode &&
    (deploymentEnvironment !== "production-demo" ||
      source.NODE_ENV !== "production" ||
      parsed.data.DEMO_PRIVATE_ROLE_LOGIN_ENABLED !== "false")
  ) {
    throw new Error("Portfolio Demo environment configuration is unsafe.");
  }

  return {
    deploymentEnvironment,
    portfolioMode,
    privateRoleLoginEnabled:
      parsed.data.DEMO_PRIVATE_ROLE_LOGIN_ENABLED === "true",
    logLevel: parsed.data.LOG_LEVEL,
  };
}

export function validatePortfolioBootstrapEnvironment(
  source: Readonly<Record<string, string | undefined>> = process.env,
): { readonly databaseName: string } {
  const runtime = validateRuntimeEnvironment(source);
  const databaseUrl = new URL(source.DATABASE_URL ?? "");
  const expectedName = source.SECURENET_PORTFOLIO_DATABASE_NAME?.trim();
  const actualName = databaseName(databaseUrl.toString());

  if (
    !runtime.portfolioMode ||
    source.ALLOW_PORTFOLIO_BOOTSTRAP !== "true" ||
    !expectedName ||
    expectedName !== actualName ||
    source.SECURENET_PRODUCTION_DATABASE_NAME !== expectedName ||
    !databaseUrl.hostname.toLowerCase().endsWith(".neon.tech") ||
    isReservedDatabaseName(actualName)
  ) {
    throw new Error(
      "Portfolio bootstrap environment is not safely authorized.",
    );
  }

  return { databaseName: actualName };
}

export function isPortfolioMode(
  source: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (source.SECURENET_PORTFOLIO_MODE !== "true") return false;
  return validateRuntimeEnvironment(source).portfolioMode;
}

export function validateProductionBootstrapEnvironment(
  source: Readonly<Record<string, string | undefined>> = process.env,
): { readonly databaseName: string } {
  const runtime = validateRuntimeEnvironment(source);
  if (
    runtime.deploymentEnvironment !== "production-demo" ||
    source.ALLOW_PRODUCTION_DEMO_BOOTSTRAP !== "true"
  ) {
    throw new Error("Production Demo bootstrap is not explicitly authorized.");
  }

  const expectedName = source.SECURENET_PRODUCTION_DATABASE_NAME?.trim();
  const actualName = databaseName(source.DATABASE_URL ?? "");
  if (
    !expectedName ||
    expectedName !== actualName ||
    isReservedDatabaseName(actualName)
  ) {
    throw new Error("Production Demo bootstrap database identity is invalid.");
  }

  return { databaseName: actualName };
}

export function isPublicDemoRoleAllowed(
  role: "ADMIN" | "NETWORK_ENGINEER" | "VIEWER",
  source: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (
    source.SECURENET_DEPLOYMENT_ENV !== "production-demo" &&
    source.SECURENET_PORTFOLIO_MODE !== "true"
  ) {
    return true;
  }
  const runtime = validateRuntimeEnvironment(source);
  return role === "VIEWER" || runtime.privateRoleLoginEnabled;
}
