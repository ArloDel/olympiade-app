export type RateLimitTier = "strict" | "mutation";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  tier: RateLimitTier | "exempt";
}

const WINDOW_MS = 60_000;
const CLEANUP_INTERVAL_MS = 60_000;
const MAX_STORE_ENTRIES = 10_000;

const TIER_LIMITS: Record<RateLimitTier, number> = {
  strict: 10,
  mutation: 40,
};

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const STRICT_PATH_PREFIXES = [
  "/api/auth/callback/credentials",
  "/api/demo/reset",
  "/api/upload",
] as const;

const rateLimitStore = new Map<string, number[]>();
let lastCleanupAt = 0;

function cleanupStaleEntries(now: number): void {
  if (
    now - lastCleanupAt < CLEANUP_INTERVAL_MS &&
    rateLimitStore.size < MAX_STORE_ENTRIES
  ) {
    return;
  }

  lastCleanupAt = now;
  const cutoff = now - WINDOW_MS;

  for (const [key, timestamps] of rateLimitStore.entries()) {
    const active = timestamps.filter((ts) => ts > cutoff);
    if (active.length === 0) {
      rateLimitStore.delete(key);
    } else if (active.length !== timestamps.length) {
      rateLimitStore.set(key, active);
    }
  }

  while (rateLimitStore.size >= MAX_STORE_ENTRIES) {
    const oldestKey = rateLimitStore.keys().next().value;
    if (oldestKey === undefined) break;
    rateLimitStore.delete(oldestKey);
  }
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstValidIp = forwardedFor
      .split(",")
      .map((part) => part.trim())
      .find(Boolean);
    if (firstValidIp) {
      return firstValidIp.slice(0, 128);
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp.slice(0, 128);
  }

  return "127.0.0.1";
}

export function isMutationMethod(method: string): boolean {
  return MUTATION_METHODS.has(method.toUpperCase());
}

export function getRateLimitTier(pathname: string): RateLimitTier {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  for (const prefix of STRICT_PATH_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return "strict";
    }
  }
  return "mutation";
}

export function checkRateLimit(
  req: { method: string; headers: Headers; nextUrl?: { pathname: string }; url?: string },
  now: number = Date.now()
): RateLimitResult {
  const method = (req.method || "GET").toUpperCase();
  if (!isMutationMethod(method)) {
    return {
      allowed: true,
      limit: Infinity,
      remaining: Infinity,
      retryAfterSeconds: 0,
      tier: "exempt",
    };
  }

  cleanupStaleEntries(now);

  const pathname =
    req.nextUrl?.pathname ??
    (req.url ? new URL(req.url, "http://localhost").pathname : "/api");
  const tier = getRateLimitTier(pathname);
  const limit = TIER_LIMITS[tier];
  const ip = getClientIp(req.headers);
  const key = `${tier}:${ip}`;

  const cutoff = now - WINDOW_MS;
  const existing = rateLimitStore.get(key) ?? [];
  const activeTimestamps = existing.filter((ts) => ts > cutoff);

  if (activeTimestamps.length >= limit) {
    rateLimitStore.set(key, activeTimestamps);
    const oldestTimestamp = activeTimestamps[0];
    const retryAfterMs = Math.max(1, oldestTimestamp + WINDOW_MS - now);
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds,
      tier,
    };
  }

  activeTimestamps.push(now);
  rateLimitStore.set(key, activeTimestamps);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - activeTimestamps.length),
    retryAfterSeconds: 0,
    tier,
  };
}

export function resetRateLimitStore(): void {
  rateLimitStore.clear();
  lastCleanupAt = 0;
}
