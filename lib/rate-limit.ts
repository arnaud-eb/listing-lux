/**
 * Per-session rate limiting backed by Upstash Redis (free tier, 10K req/day).
 *
 * Why Upstash: Vercel Hobby has no KV; in-memory limiters don't survive cold starts
 * or scale-outs. Upstash's free tier covers MVP traffic by ~100×.
 *
 * Graceful degradation: when UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN
 * are missing (local dev, CI), `checkRateLimit` is a no-op and returns
 * `{ success: true }`. This keeps tests hermetic and lets the rate-limiter ship
 * to production behind env config without breaking anyone's local setup.
 *
 * Audit P1.2 — see docs/audits/2026-04-llm-output-audit/README.md §5.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitKind = "generate" | "photoAnalysis";

/**
 * Limits per session per minute. Tuned for the audit's "11 rapid requests should
 * 429" manual test on `generate`, and a higher ceiling on `photoAnalysis` because
 * agents upload many photos in a single batch.
 */
const LIMITS: Record<RateLimitKind, { tokens: number; window: `${number} ${"s" | "m" | "h"}` }> = {
  generate: { tokens: 10, window: "1 m" },
  // Stays above MAX_PHOTOS (50) so a full batch upload never trips the limiter
  // and silently drops analyses mid-batch, with headroom for re-adds/retries.
  photoAnalysis: { tokens: 80, window: "1 m" },
};

let redis: Redis | null = null;
const limiters: Partial<Record<RateLimitKind, Ratelimit>> = {};

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(kind: RateLimitKind): Ratelimit | null {
  if (limiters[kind]) return limiters[kind]!;
  const r = getRedis();
  if (!r) return null;
  const { tokens, window } = LIMITS[kind];
  limiters[kind] = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `rl:${kind}`,
    analytics: false,
  });
  return limiters[kind]!;
}

/**
 * Throw this from server actions when the rate limit is exhausted. The action
 * doesn't have an HTTP status, so the typed `name` lets clients (and the toast
 * layer) detect the case without parsing error message text.
 */
export class RateLimitError extends Error {
  /** Seconds the caller should wait before retrying. */
  readonly retryAfter: number;
  constructor(retryAfter: number) {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export interface RateLimitResult {
  success: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Total tokens allowed in the window. */
  limit: number;
  /** Unix epoch (ms) when the window resets. */
  reset: number;
}

/**
 * Check the per-session rate limit. Returns success=true when no Upstash config
 * is present (dev mode), so callers always have a usable result.
 *
 * On Upstash failure (network, quota exhausted, etc.) we fail OPEN — better to
 * let a legitimate user through than 500 a paying customer because the limiter
 * is briefly down. The OpenAI call below will still cost real money, but the
 * blast-radius is bounded by Vercel's 10s function timeout.
 */
export async function checkRateLimit(
  sessionId: string,
  kind: RateLimitKind,
): Promise<RateLimitResult> {
  const limit = LIMITS[kind].tokens;
  const limiter = getLimiter(kind);
  if (!limiter) {
    return { success: true, remaining: limit, limit, reset: Date.now() };
  }
  try {
    const result = await limiter.limit(sessionId);
    return {
      success: result.success,
      remaining: result.remaining,
      limit,
      reset: result.reset,
    };
  } catch {
    return { success: true, remaining: limit, limit, reset: Date.now() };
  }
}

/**
 * Build the standard rate-limit headers (per IETF draft + GitHub/Vercel convention).
 * Caller is responsible for adding `Retry-After` separately when returning 429.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  };
}
