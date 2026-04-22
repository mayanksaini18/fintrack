const store = new Map<string, { count: number; reset: number }>();

export function rateLimit(userId: string, limit = 10, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(userId);

  if (!entry || now > entry.reset) {
    store.set(userId, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  entry.count++;
  return { ok: true, remaining: limit - entry.count };
}
