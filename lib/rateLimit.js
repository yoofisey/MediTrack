const buckets = new Map();

export function checkRateLimit(key, maxRequests = 30, windowMs = 60000) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  bucket.count++;
  if (bucket.count > maxRequests) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((bucket.start + windowMs - now) / 1000) };
  }

  return { allowed: true, remaining: maxRequests - bucket.count };
}

export function rateLimit(req, maxRequests = 30, windowMs = 60000) {
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown";
  const result = checkRateLimit(ip, maxRequests, windowMs);
  if (!result.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(result.retryAfter) },
    });
  }
  return null;
}

const CLEANUP_INTERVAL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.start > CLEANUP_INTERVAL * 2) buckets.delete(key);
  }
}, CLEANUP_INTERVAL).unref?.();
