export function formatDateTime(value: string | null): string {
  if (!value) return "Unavailable";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Muscat",
  }).format(new Date(value));
}

export function formatMetric(
  value: number | null | undefined,
  unit: string,
  maximumFractionDigits = 1,
): string {
  if (value === null || value === undefined) return "Unavailable";
  return `${new Intl.NumberFormat("en", { maximumFractionDigits }).format(value)} ${unit}`;
}

export function formatUptime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "Unavailable";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  return `${days}d ${hours}h`;
}
