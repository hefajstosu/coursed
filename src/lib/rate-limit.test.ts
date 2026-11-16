import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Bez zmiennych Upstash moduł używa fallbacku in-memory — to testujemy.
vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
const { rateLimit } = await import("@/lib/rate-limit");

const config = { limit: 2, windowMs: 60_000 };

describe("rateLimit (in-memory fallback)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to the limit, then blocks", async () => {
    expect(await rateLimit("t:block", config)).toMatchObject({ ok: true, remaining: 1 });
    expect(await rateLimit("t:block", config)).toMatchObject({ ok: true, remaining: 0 });
    expect(await rateLimit("t:block", config)).toMatchObject({ ok: false, remaining: 0 });
  });

  it("resets after the window passes", async () => {
    await rateLimit("t:reset", config);
    await rateLimit("t:reset", config);
    expect((await rateLimit("t:reset", config)).ok).toBe(false);
    vi.advanceTimersByTime(config.windowMs);
    expect((await rateLimit("t:reset", config)).ok).toBe(true);
  });

  it("tracks keys independently", async () => {
    await rateLimit("t:a", config);
    await rateLimit("t:a", config);
    expect((await rateLimit("t:b", config)).ok).toBe(true);
  });
});
