import {
  checkRateLimit,
  getClientIp,
  getRateLimitTier,
  isMutationMethod,
  resetRateLimitStore
} from "@/lib/rate-limit";

async function runRateLimitSecurityTests() {
  console.log("=== Testing Rate Limiting & Brute-Force Protection ===");

  resetRateLimitStore();

  // 1. Test Client IP Resolution Priorities
  console.log("\n1. Testing Client IP Detection Priorities...");
  const h1 = new Headers({ "cf-connecting-ip": "203.0.113.195" });
  if (getClientIp(h1) !== "203.0.113.195") {
    throw new Error("Failed to extract cf-connecting-ip");
  }

  const h2 = new Headers({ "true-client-ip": "198.51.100.42" });
  if (getClientIp(h2) !== "198.51.100.42") {
    throw new Error("Failed to extract true-client-ip");
  }

  const h3 = new Headers({ "x-forwarded-for": "192.0.2.1, 10.0.0.1" });
  if (getClientIp(h3) !== "192.0.2.1") {
    throw new Error("Failed to extract first client IP from x-forwarded-for");
  }

  const h4 = new Headers({ "x-real-ip": "192.0.2.88" });
  if (getClientIp(h4) !== "192.0.2.88") {
    throw new Error("Failed to extract x-real-ip");
  }

  const hEmpty = new Headers();
  if (getClientIp(hEmpty) !== "127.0.0.1") {
    throw new Error("Failed to fallback to 127.0.0.1 on empty headers");
  }
  console.log("✓ Correctly RESOLVED: Edge, CDN, reverse-proxy, and fallback IPs.");

  // 2. Test Strict Security Path Tiers
  console.log("\n2. Testing Rate Limit Path Tiers...");
  const strictPaths = [
    "/api/auth/signin",
    "/api/auth/callback/credentials",
    "/api/admin/users/lock",
    "/api/superadmin/users",
    "/api/superadmin/emergency",
    "/api/demo/reset",
    "/api/upload",
  ];

  for (const path of strictPaths) {
    const tier = getRateLimitTier(path);
    if (tier !== "strict") {
      throw new Error(`Expected tier 'strict' for ${path}, got '${tier}'`);
    }
  }
  console.log("✓ Correctly ASSIGNED: All authentication and admin sensitive paths assigned to 'strict' tier.");

  const generalMutationPaths = [
    "/api/submissions",
    "/api/proctoring",
    "/api/questions/link",
  ];
  for (const path of generalMutationPaths) {
    const tier = getRateLimitTier(path);
    if (tier !== "mutation") {
      throw new Error(`Expected tier 'mutation' for ${path}, got '${tier}'`);
    }
  }
  console.log("✓ Correctly ASSIGNED: General examination mutations assigned to 'mutation' tier (40 req/min).");

  // 3. Test Brute-Force Mitigation (Strict limit: 10)
  console.log("\n3. Testing Brute-Force Blocking on Strict Endpoints (Limit: 10)...");
  resetRateLimitStore();

  const mockAuthReq = {
    method: "POST",
    headers: new Headers({ "x-real-ip": "103.20.10.5" }),
    url: "http://localhost:3000/api/auth/signin",
  };

  const baseTime = Date.now();

  for (let i = 1; i <= 10; i++) {
    const res = checkRateLimit(mockAuthReq, baseTime + i * 100);
    if (!res.allowed) {
      throw new Error(`Request ${i} should be allowed!`);
    }
  }
  console.log("✓ Correctly ALLOWED: 10 sequential attempts permitted.");

  // 11th attempt should be blocked
  const blockedRes = checkRateLimit(mockAuthReq, baseTime + 1100);
  if (blockedRes.allowed) {
    throw new Error("11th attempt should have been BLOCKED!");
  }
  if (blockedRes.retryAfterSeconds <= 0) {
    throw new Error("retryAfterSeconds must be > 0 on blocked request");
  }
  console.log(`✓ Correctly BLOCKED: 11th request blocked (429 Too Many Requests, Retry-After: ${blockedRes.retryAfterSeconds}s).`);

  // 4. Test Exemption for Safe GET Requests
  console.log("\n4. Testing Non-Mutation Exemption...");
  const getReq = {
    method: "GET",
    headers: new Headers({ "x-real-ip": "103.20.10.5" }),
    url: "http://localhost:3000/api/auth/signin",
  };
  const getRes = checkRateLimit(getReq, baseTime + 1200);
  if (!getRes.allowed || getRes.tier !== "exempt") {
    throw new Error("GET request should be exempt from rate limiting!");
  }
  console.log("✓ Correctly EXEMPTED: Safe read/GET requests do not consume rate limit quotas.");

  console.log("\n=== ALL RATE LIMIT SECURITY TESTS PASSED SUCCESSFULLY! ===");
}

runRateLimitSecurityTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
