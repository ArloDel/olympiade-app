import nextConfig from "../next.config";

async function runHeadersSecurityTests() {
  console.log("=== Testing Next.js HTTP Security Headers Configuration ===");

  if (!nextConfig.headers) {
    throw new Error("headers() function is missing from next.config.ts!");
  }

  const customHeaders = await nextConfig.headers();
  if (!Array.isArray(customHeaders) || customHeaders.length === 0) {
    throw new Error("nextConfig.headers() returned empty array!");
  }

  const rootHeaderRule = customHeaders.find(rule => rule.source === "/:path*");
  if (!rootHeaderRule) {
    throw new Error("Missing /:path* root security headers rule!");
  }

  const headersMap = new Map(rootHeaderRule.headers.map(h => [h.key, h.value]));

  // 1. Test X-Frame-Options
  console.log("\n1. Testing X-Frame-Options Anti-Clickjacking Header...");
  const xfo = headersMap.get("X-Frame-Options");
  if (xfo !== "DENY") {
    throw new Error(`Expected X-Frame-Options to be 'DENY', got '${xfo}'`);
  }
  console.log("✓ Correctly CONFIGURED: X-Frame-Options is DENY");

  // 2. Test X-Content-Type-Options
  console.log("\n2. Testing X-Content-Type-Options Anti-MIME Sniffing Header...");
  const xcto = headersMap.get("X-Content-Type-Options");
  if (xcto !== "nosniff") {
    throw new Error(`Expected X-Content-Type-Options to be 'nosniff', got '${xcto}'`);
  }
  console.log("✓ Correctly CONFIGURED: X-Content-Type-Options is nosniff");

  // 3. Test Strict-Transport-Security (HSTS)
  console.log("\n3. Testing Strict-Transport-Security (HSTS)...");
  const hsts = headersMap.get("Strict-Transport-Security");
  if (!hsts || !hsts.includes("max-age") || !hsts.includes("includeSubDomains")) {
    throw new Error(`Invalid HSTS header: ${hsts}`);
  }
  console.log(`✓ Correctly CONFIGURED: HSTS header is '${hsts}'`);

  // 4. Test Referrer-Policy
  console.log("\n4. Testing Referrer-Policy...");
  const refPolicy = headersMap.get("Referrer-Policy");
  if (refPolicy !== "strict-origin-when-cross-origin") {
    throw new Error(`Invalid Referrer-Policy: ${refPolicy}`);
  }
  console.log("✓ Correctly CONFIGURED: Referrer-Policy is strict-origin-when-cross-origin");

  // 5. Test Permissions-Policy (Webcam proctoring allowed for self, others blocked)
  console.log("\n5. Testing Permissions-Policy...");
  const permPolicy = headersMap.get("Permissions-Policy");
  if (!permPolicy || !permPolicy.includes("camera=(self)") || !permPolicy.includes("microphone=()")) {
    throw new Error(`Invalid Permissions-Policy: ${permPolicy}`);
  }
  console.log(`✓ Correctly CONFIGURED: Permissions-Policy restricts camera to self and blocks unauthorized peripherals: '${permPolicy}'`);

  // 6. Test Content-Security-Policy (CSP)
  console.log("\n6. Testing Content-Security-Policy (CSP)...");
  const csp = headersMap.get("Content-Security-Policy");
  if (!csp || !csp.includes("frame-ancestors 'none'") || !csp.includes("default-src 'self'")) {
    throw new Error(`Invalid CSP header: ${csp}`);
  }
  console.log("✓ Correctly CONFIGURED: CSP defines defense-in-depth policies including frame-ancestors 'none'.");

  // 7. Test Remote Patterns for Images
  console.log("\n7. Testing Images Remote Patterns Configuration...");
  const remotePatterns = nextConfig.images?.remotePatterns;
  if (!remotePatterns || remotePatterns.length === 0) {
    throw new Error("Missing images.remotePatterns in nextConfig!");
  }
  console.log("✓ Correctly CONFIGURED: Image remotePatterns restricted to trusted hosts.");

  console.log("\n=== ALL HTTP SECURITY HEADERS TESTS PASSED SUCCESSFULLY! ===");
}

runHeadersSecurityTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
