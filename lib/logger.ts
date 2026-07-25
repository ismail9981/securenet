type LogLevel = "info" | "warn" | "error";

const REDACTED_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "cookie",
  "authorization",
]);

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        REDACTED_KEYS.has(key) ? "[REDACTED]" : sanitizeValue(nestedValue),
      ]),
    );
  }

  return value;
}

export function logEvent(
  level: LogLevel,
  event: string,
  context: Readonly<Record<string, unknown>> = {},
): void {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...(sanitizeValue(context) as Record<string, unknown>),
  });

  if (level === "error") {
    console.error(record);
  } else if (level === "warn") {
    console.warn(record);
  } else {
    console.info(record);
  }
}
