// Rate Limiter for DDoS Protection
// Uses in-memory store with cleanup (in production, use Redis)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 100; // Max requests per window per IP

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetTime < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(ipAddress: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(ipAddress);

  // Create new entry if doesn't exist
  if (!entry) {
    store.set(ipAddress, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return { success: true, remaining: MAX_REQUESTS - 1 };
  }

  // Reset if window has passed
  if (entry.resetTime < now) {
    entry.count = 1;
    entry.resetTime = now + WINDOW_MS;
    return { success: true, remaining: MAX_REQUESTS - 1 };
  }

  // Check limit
  if (entry.count >= MAX_REQUESTS) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: MAX_REQUESTS - entry.count };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip.trim();
}
