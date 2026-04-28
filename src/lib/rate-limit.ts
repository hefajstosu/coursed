/**
 * Minimalny in-memory rate limiter per (userId, action). Per-process — nie skaluje
 * się horyzontalnie; w produkcji (Vercel + serverless) zastąpić Upstash Ratelimit.
 *
 * Zwraca true gdy operacja dozwolona, false gdy przekroczono limit.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitConfig = {
  /** maks. operacji w oknie */
  limit: number;
  /** okno w ms */
  windowMs: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitConfig,
): { ok: boolean; remaining: number; resetAt: number } {
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

// Predefiniowane limity per akcja
export const LIMITS = {
  rate: { limit: 30, windowMs: 60 * 60 * 1000 }, // 30/h
  review: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10/h
  vote: { limit: 60, windowMs: 60 * 60 * 1000 }, // 60/h
  report: { limit: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10/dzień
  courseRequest: { limit: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5/dzień
} as const;
