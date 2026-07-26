export const DEFAULT_STALE_AFTER_SECONDS = 90;

export function isMetricStale(
  sourceTime: Date,
  now = new Date(),
  staleAfterSeconds = DEFAULT_STALE_AFTER_SECONDS,
): boolean {
  return now.getTime() - sourceTime.getTime() > staleAfterSeconds * 1000;
}
