import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We have to reset module state between tests because the helper memoizes the
// Upstash client + limiters in module-level vars. resetModules + dynamic import
// give each test a fresh copy.

const mockLimit = vi.fn();
class MockRatelimit {
  limit = mockLimit;
  static slidingWindow = vi.fn(() => "sliding-window-stub");
}
vi.mock("@upstash/ratelimit", () => ({ Ratelimit: MockRatelimit }));

class MockRedis {}
vi.mock("@upstash/redis", () => ({ Redis: MockRedis }));

beforeEach(() => {
  vi.resetModules();
  mockLimit.mockReset();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

afterEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe("checkRateLimit — env-driven graceful degradation", () => {
  it("returns success=true when both Upstash env vars are missing", async () => {
    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("session-A", "generate");
    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it("returns success=true when only URL is set (token missing)", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("session-A", "generate");
    expect(result.success).toBe(true);
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it("returns success=true when only token is set (URL missing)", async () => {
    process.env.UPSTASH_REDIS_REST_TOKEN = "secret";
    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("session-A", "generate");
    expect(result.success).toBe(true);
    expect(mockLimit).not.toHaveBeenCalled();
  });
});

describe("checkRateLimit — Upstash-backed path", () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "secret";
  });

  it("calls Upstash and returns success=true under limit", async () => {
    mockLimit.mockResolvedValueOnce({
      success: true,
      remaining: 9,
      reset: 1_700_000_000_000,
    });
    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("session-A", "generate");
    expect(mockLimit).toHaveBeenCalledWith("session-A");
    expect(result).toEqual({
      success: true,
      remaining: 9,
      limit: 10,
      reset: 1_700_000_000_000,
    });
  });

  it("returns success=false when Upstash denies", async () => {
    mockLimit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: 1_700_000_060_000,
    });
    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("session-A", "generate");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("fails OPEN when Upstash throws (network / quota down)", async () => {
    mockLimit.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const { checkRateLimit } = await import("./rate-limit");
    const result = await checkRateLimit("session-A", "generate");
    expect(result.success).toBe(true);
  });

  it("uses different limits per kind (generate=10, photoAnalysis=80)", async () => {
    mockLimit.mockResolvedValue({
      success: true,
      remaining: 0,
      reset: 0,
    });
    const { checkRateLimit } = await import("./rate-limit");
    const gen = await checkRateLimit("s", "generate");
    const photo = await checkRateLimit("s", "photoAnalysis");
    expect(gen.limit).toBe(10);
    expect(photo.limit).toBe(80);
  });
});

describe("rateLimitHeaders", () => {
  it("emits canonical X-RateLimit-* headers", async () => {
    const { rateLimitHeaders } = await import("./rate-limit");
    const headers = rateLimitHeaders({
      success: true,
      remaining: 7,
      limit: 10,
      reset: 1_700_000_001_500,
    });
    expect(headers).toEqual({
      "X-RateLimit-Limit": "10",
      "X-RateLimit-Remaining": "7",
      "X-RateLimit-Reset": "1700000002",
    });
  });
});

describe("RateLimitError", () => {
  it("carries retryAfter and has name=RateLimitError", async () => {
    const { RateLimitError } = await import("./rate-limit");
    const err = new RateLimitError(42);
    expect(err.name).toBe("RateLimitError");
    expect(err.retryAfter).toBe(42);
    expect(err instanceof Error).toBe(true);
  });
});
