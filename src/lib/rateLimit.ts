import { headers } from 'next/headers';

/**
 * Minimal in-memory rate limiter for MVP anti-spam.
 * Keyed by client IP + bucket name, fixed sliding window.
 *
 * Note: state lives in the server process. On serverless/multi-instance
 * deploys each instance keeps its own window — acceptable as a first line
 * of defense. Swap for a shared store (e.g. Redis) if abuse grows.
 */

interface Hit {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000; // 1 minute
const MAX_HITS = 5; // per window, per IP, per bucket

const store = new Map<string, Hit>();

function clientIp(): string {
  const h = headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') ?? 'unknown';
}

// Drop entries whose window has fully elapsed so the map can't grow unbounded
// under many distinct IPs over the process lifetime.
function evictExpired(now: number): void {
  for (const [key, hit] of store) {
    if (now - hit.windowStart > WINDOW_MS) store.delete(key);
  }
}

export function checkRateLimit(bucket: string, now = Date.now()): boolean {
  const key = `${bucket}:${clientIp()}`;
  const hit = store.get(key);

  if (!hit || now - hit.windowStart > WINDOW_MS) {
    if (store.size > 500) evictExpired(now);
    store.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (hit.count >= MAX_HITS) {
    return false;
  }

  hit.count += 1;
  return true;
}
