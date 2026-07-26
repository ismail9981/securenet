const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

export function requireDatabaseUrl(
  variableName: "DATABASE_URL" | "TEST_DATABASE_URL" = "DATABASE_URL",
): string {
  const value = process.env[variableName];

  if (!value) {
    throw new Error(`${variableName} is required.`);
  }

  const parsed = new URL(value);
  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`${variableName} must use PostgreSQL.`);
  }

  return value;
}

export function requireTestDatabaseUrl(): string {
  const value = requireDatabaseUrl("TEST_DATABASE_URL");
  const databaseName = new URL(value).pathname.replace(/^\/+/, "");

  if (databaseName !== "securenet_test") {
    throw new Error(
      "Refusing destructive test operation: TEST_DATABASE_URL must target securenet_test.",
    );
  }

  return value;
}
