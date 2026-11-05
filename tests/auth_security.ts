import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function runTests() {
  console.log("=== Testing Password Hashing & NextAuth Authentication ===");

  const authorize = (authOptions.providers[0] as any).options.authorize;

  // 1. Test student login with correct password
  console.log("\n1. Testing student login with 'password123'...");
  const student = await authorize({
    identifier: "student@olym.app",
    password: "password123"
  });
  console.log("✓ Student logged in successfully:", student.email, student.role);

  // Check if student now has bcrypt password in DB
  const studentInDb = await prisma.user.findUnique({
    where: { email: "student@olym.app" },
    select: { password: true }
  });
  console.log("✓ Student password in DB is hashed:", !!studentInDb?.password, studentInDb?.password?.startsWith("$2"));
  if (!studentInDb?.password?.startsWith("$2")) {
    throw new Error("Student password was not hashed with bcrypt!");
  }

  // 2. Test student login again with stored hash
  console.log("\n2. Testing subsequent login with hashed password in DB...");
  const student2 = await authorize({
    identifier: "student@olym.app",
    password: "password123"
  });
  console.log("✓ Subsequent login succeeded:", student2.email);

  // 3. Test wrong password
  console.log("\n3. Testing wrong password rejection...");
  let failed = false;
  try {
    await authorize({
      identifier: "student@olym.app",
      password: "wrongpassword123"
    });
  } catch (err: any) {
    failed = true;
    console.log("✓ Correctly rejected with error:", err.message);
  }
  if (!failed) {
    throw new Error("Expected wrong password to fail, but it succeeded!");
  }

  // 4. Test admin login
  console.log("\n4. Testing admin login...");
  const admin = await authorize({
    identifier: "admin@olym.app",
    password: "password123"
  });
  console.log("✓ Admin logged in successfully:", admin.email, admin.role);

  // 5. Test superadmin login
  console.log("\n5. Testing superadmin login...");
  const superadmin = await authorize({
    identifier: "superadmin@olym.app",
    password: "password123"
  });
  console.log("✓ Superadmin logged in successfully:", superadmin.email, superadmin.role);

  console.log("\n=== ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY! ===");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
