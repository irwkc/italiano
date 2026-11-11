type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || cur.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true as const, remaining: limit - 1 };
  }
  if (cur.count >= limit) return { ok: false as const, remaining: 0 };
  cur.count += 1;
  return { ok: true as const, remaining: limit - cur.count };
}
