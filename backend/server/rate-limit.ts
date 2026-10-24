import { AppError } from "./errors";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  readonly max: number;
  readonly windowMs: number;
}

export function consumeRateLimit(key: string, options: RateLimitOptions): { remaining: number; resetAt: number } {
  const now = Date.now();
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + options.windowMs } : current;
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > options.max) {
    throw new AppError("RATE_LIMITED", "Too many requests", 429, {
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    });
  }
  return { remaining: Math.max(0, options.max - bucket.count), resetAt: bucket.resetAt };
}

export function resetRateLimits(): void {
  buckets.clear();
}
