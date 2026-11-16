import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiter per (key, config). Używa Upstash Redis gdy ustawione
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN. W innym przypadku
 * fallback do in-memory bucketów (ok. dla deva, niezgodne z multi-instance prod).
 */

export type RateLimitConfig = {
  /** maks. operacji w oknie */
  limit: number;
  /** okno w ms */
  windowMs: number;
};

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

// ── Upstash ───────────────────────────────────────────────────────────────

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = !!(upstashUrl && upstashToken);

const redis: Redis | null = useUpstash
  ? new Redis({ url: upstashUrl!, token: upstashToken! })
  : null;

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(config: RateLimitConfig): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${config.limit}:${config.windowMs}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, `${config.windowMs} ms`),
    analytics: false,
    prefix: "rl",
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

// ── In-memory fallback ────────────────────────────────────────────────────

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function memoryRateLimit(key: string, { limit, windowMs }: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// ── Public API ────────────────────────────────────────────────────────────

export async function rateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const limiter = getLimiter(config);
  if (limiter) {
    const r = await limiter.limit(key);
    return {
      ok: r.success,
      remaining: r.remaining,
      resetAt: r.reset,
    };
  }
  return memoryRateLimit(key, config);
}

// Predefiniowane limity per akcja
export const LIMITS = {
  rate: { limit: 30, windowMs: 60 * 60 * 1000 }, // 30/h
  review: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10/h
  vote: { limit: 60, windowMs: 60 * 60 * 1000 }, // 60/h
  report: { limit: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10/dzień
  courseRequest: { limit: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5/dzień
  magicLinkEmail: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5/h na adres e-mail
  magicLinkIp: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20/h na IP
} as const;
