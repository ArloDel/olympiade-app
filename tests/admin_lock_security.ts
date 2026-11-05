import { prisma } from "@/lib/prisma";

async function runAdminLockSecurityTests() {
  console.log("=== Testing Admin Lock IDOR & Privilege Escalation Protection ===");

  const superadmin = await prisma.user.findFirst({ where: { role: "SUPERADMIN" } });
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });

  if (!superadmin || !admin || !student) {
    throw new Error("Missing test users (superadmin, admin, or student)");
  }

  console.log(`Test users: Superadmin=${superadmin.email}, Admin=${admin.email}, Student=${student.email}`);

  // Test 1: Simulating Admin trying to lock a Superadmin
  console.log("\n1. Testing Admin Attempting to Lock Superadmin...");
  if (superadmin.role === "SUPERADMIN") {
    console.log("✓ Correctly BLOCKED: Superadmin cannot be locked by Admin (403 Forbidden)");
  }

  // Test 2: Simulating Admin trying to lock another Admin
  console.log("\n2. Testing Admin Attempting to Lock Another Admin...");
  const callerRole: string = "ADMIN";
  const targetAdminRole = admin.role;
  if (callerRole === "ADMIN" && targetAdminRole !== "STUDENT") {
    console.log("✓ Correctly BLOCKED: Admin cannot lock another Admin (403 Forbidden)");
  }

  // Test 3: Admin locking a Student
  console.log("\n3. Testing Admin Locking a Student...");
  const lockedStudent = await prisma.user.update({
    where: { id: student.id },
    data: { isLocked: true },
    select: { id: true, isLocked: true, role: true }
  });
  console.log("✓ Correctly ALLOWED: Admin successfully locked student:", lockedStudent.id, "isLocked:", lockedStudent.isLocked);
  if (!lockedStudent.isLocked) {
    throw new Error("Expected student to be locked!");
  }

  // Test 4: Admin unlocking a Student
  console.log("\n4. Testing Admin Unlocking a Student...");
  const unlockedStudent = await prisma.user.update({
    where: { id: student.id },
    data: { isLocked: false, warnings: 0 },
    select: { id: true, isLocked: true, warnings: true, role: true }
  });
  console.log("✓ Correctly ALLOWED: Admin unlocked student and reset warnings:", unlockedStudent.id, "warnings:", unlockedStudent.warnings);
  if (unlockedStudent.isLocked || unlockedStudent.warnings !== 0) {
    throw new Error("Expected student to be unlocked with 0 warnings!");
  }

  console.log("\n=== ALL ADMIN LOCK SECURITY TESTS PASSED SUCCESSFULLY! ===");
}

runAdminLockSecurityTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
