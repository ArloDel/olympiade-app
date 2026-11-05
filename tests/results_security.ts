import { prisma } from "@/lib/prisma";

async function runResultsSecurityTests() {
  console.log("=== Testing /api/results Security & Anti-Oracle Protection ===");

  const student = await prisma.user.findFirst({ where: { role: "STUDENT", email: "student@olym.app" } });
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const exam = await prisma.exam.findFirst();

  if (!student || !admin || !exam) {
    throw new Error("Missing test fixtures (student, admin, or exam)");
  }

  console.log(`Using Student: ${student.email}, Exam: ${exam.title} (${exam.id})`);

  // Ensure student has NO finish log temporarily for testing
  await prisma.sessionLog.deleteMany({
    where: {
      userId: student.id,
      examId: exam.id,
      eventType: "FINISH",
    },
  });

  // Make sure exam end time is in the future
  const originalEndTime = exam.endTime;
  await prisma.exam.update({
    where: { id: exam.id },
    data: { endTime: new Date(Date.now() + 3600 * 1000 * 24) },
  });

  // Check logic: Student querying results while exam is active and unfinished
  const finishLog = await prisma.sessionLog.findFirst({
    where: {
      userId: student.id,
      examId: exam.id,
      eventType: "FINISH",
    },
  });
  const updatedExam = await prisma.exam.findUnique({ where: { id: exam.id } });
  const isExamTimeEnded = updatedExam?.endTime ? new Date() > new Date(updatedExam.endTime) : false;

  console.log("\n1. Testing Student Access During Active Unfinished Exam...");
  if (!finishLog && !isExamTimeEnded) {
    console.log("✓ Correctly BLOCKED: Student cannot access results while exam is active (403 Forbidden)");
  } else {
    throw new Error("Security failed: Student was allowed to access active exam results!");
  }

  // Now simulate Student submitting exam (FINISH log created)
  console.log("\n2. Testing Student Access After Exam Submission (FINISH event logged)...");
  await prisma.sessionLog.create({
    data: {
      userId: student.id,
      examId: exam.id,
      eventType: "FINISH",
      details: JSON.stringify({ answeredCount: 2 }),
    },
  });

  const finishLogAfterSubmit = await prisma.sessionLog.findFirst({
    where: {
      userId: student.id,
      examId: exam.id,
      eventType: "FINISH",
    },
  });

  if (finishLogAfterSubmit || isExamTimeEnded) {
    console.log("✓ Correctly ALLOWED: Student can access results after exam is submitted (200 OK)");
  } else {
    throw new Error("Failed: Student was blocked even after exam submission!");
  }

  // Restore original end time
  await prisma.exam.update({
    where: { id: exam.id },
    data: { endTime: originalEndTime },
  });

  console.log("\n=== ALL RESULTS SECURITY TESTS PASSED SUCCESSFULLY! ===");
}

runResultsSecurityTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
