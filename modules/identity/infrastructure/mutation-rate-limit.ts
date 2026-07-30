const WINDOW_MS = 60_000;
const MAX_MUTATIONS = 60;

interface MutationBucket {
  count: number;
  resetAt: number;
}

const mutationBuckets = new Map<string, MutationBucket>();

export class MutationRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Administrative mutation rate limit exceeded.");
    this.name = "MutationRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function checkMutationRateLimit(
  key: string,
  now = Date.now(),
): { readonly allowed: boolean; readonly retryAfterSeconds: number } {
  const current = mutationBuckets.get(key);
  if (!current || current.resetAt <= now) {
    mutationBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= MAX_MUTATIONS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetMutationRateLimits(): void {
  mutationBuckets.clear();
}
