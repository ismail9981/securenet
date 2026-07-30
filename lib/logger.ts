type LogLevel = "debug" | "info" | "warn" | "error";

const REDACTED_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "cookie",
  "authorization",
  "databaseUrl",
  "connectionString",
  "secret",
]);

const LEVEL_PRIORITY: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function configuredLevel(): LogLevel {
  const level = process.env.LOG_LEVEL;
  return level === "debug" ||
    level === "info" ||
    level === "warn" ||
    level === "error"
    ? level
    : "info";
}

export function sanitizeLogValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeLogValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        REDACTED_KEYS.has(key) ||
        /(password|secret|token|cookie|authorization|database.?url|connection.?string)/i.test(
          key,
        )
          ? "[REDACTED]"
          : sanitizeLogValue(nestedValue),
      ]),
    );
  }

  if (
    typeof value === "string" &&
    /(?:postgres(?:ql)?:\/\/|authorization:\s*|cookie:\s*)/i.test(value)
  ) {
    return "[REDACTED]";
  }

  return value;
}

export function logEvent(
  level: LogLevel,
  event: string,
  context: Readonly<Record<string, unknown>> = {},
): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[configuredLevel()]) return;

  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...(sanitizeLogValue(context) as Record<string, unknown>),
  });

  if (level === "error") {
    console.error(record);
  } else if (level === "warn") {
    console.warn(record);
  } else {
    console.info(record);
  }
}
