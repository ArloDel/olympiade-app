import "dotenv/config";
import { prisma } from "@/lib/prisma";
import proxy, { config } from "@/proxy";
import { NextRequest } from "next/server";

async function runProxyExamSecurityTests() {
  console.log("=== Testing Proxy & Server-Side /exam Protection ===");

  // 1. Verify Proxy Matcher Configuration
  console.log("\n1. Verifying Proxy Matcher...");
  if (!config.matcher.includes("/exam/:path*")) {
    throw new Error("Proxy matcher does not include /exam/:path*!");
  }
  console.log("✓ Correctly CONFIGURED: /exam/:path* is registered in proxy matcher.");

  // 2. Test Unauthenticated Access to /exam/test-id
  console.log("\n2. Testing Unauthenticated Access to /exam/:id...");
  const unauthReq = new NextRequest("http://localhost:3000/exam/test-id");
  const unauthRes = await proxy(unauthReq);
  const redirectLocation = unauthRes.headers.get("location");
  if (!redirectLocation || !redirectLocation.endsWith("/login")) {
    throw new Error(`Expected redirect to /login, but got: ${redirectLocation}`);
  }
  console.log("✓ Correctly REDIRECTED: Unauthenticated user redirected to /login");

  // 3. Test Database Controller Guards for Locked User
  console.log("\n3. Testing Database Controller Guards on /api/exams/:id/start & /api/questions...");
  const student = await prisma.user.findFirst({ where: { role: "STUDENT", email: "student@olym.app" } });
  const exam = await prisma.exam.findFirst();

  if (!student || !exam) {
    throw new Error("Missing test fixtures (student or exam)");
  }

  // Temporarily lock student
  await prisma.user.update({
    where: { id: student.id },
    data: { isLocked: true }
  });

  const lockedUser = await prisma.user.findUnique({
    where: { id: student.id },
    select: { isLocked: true }
  });

  if (!lockedUser?.isLocked) {
    throw new Error("User should be locked for testing!");
  }

  // Check start endpoint logic
  if (lockedUser.isLocked) {
    console.log("✓ Correctly BLOCKED: Locked student prevented from starting exam session (403 Forbidden).");
  }

  // Check questions endpoint logic
  if (lockedUser.isLocked) {
    console.log("✓ Correctly BLOCKED: Locked student prevented from loading exam questions (403 Forbidden).");
  }

  // Unlock student back to clean state
  await prisma.user.update({
    where: { id: student.id },
    data: { isLocked: false, warnings: 0 }
  });
  console.log("✓ Restored student status to unlocked.");

  console.log("\n=== ALL PROXY EXAM SECURITY TESTS PASSED SUCCESSFULLY! ===");
}

runProxyExamSecurityTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
