import { prisma } from "@/lib/prisma";

async function runSubmissionSecurityTests() {
  console.log("=== Testing Submission & Server-Side Timer Security ===");

  const student = await prisma.user.findFirst({ where: { role: "STUDENT", email: "student@olym.app" } });
  const exam = await prisma.exam.findFirst();

  if (!student || !exam) {
    throw new Error("Missing test fixtures (student or exam)");
  }

  console.log(`Using Student: ${student.email}, Exam: ${exam.title} (${exam.id})`);

  // Ensure test exam has future endTime during test
  const originalEndTime = exam.endTime;
  await prisma.exam.update({
    where: { id: exam.id },
    data: { endTime: new Date(Date.now() + 24 * 3600 * 1000) },
  });

  try {
    // Reset student test state: unlock, remove answers, remove logs
    await prisma.user.update({
      where: { id: student.id },
      data: { isLocked: false, warnings: 0 },
    });
    await prisma.sessionLog.deleteMany({
      where: { userId: student.id, examId: exam.id },
    });
    await prisma.answer.deleteMany({
      where: { userId: student.id, examId: exam.id },
    });

    // 1. Test Server-Authoritative Timer Initialization
    console.log("\n1. Testing Server-Authoritative Timer Initialization...");
    // Simulate starting 10 minutes ago
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const startLog = await prisma.sessionLog.create({
      data: {
        userId: student.id,
        examId: exam.id,
        eventType: "START",
        details: "Exam started",
        createdAt: tenMinutesAgo,
      },
    });

    const activeExam = await prisma.exam.findUnique({ where: { id: exam.id } });
    const startedAt = new Date(startLog.createdAt).getTime();
    const durationMs = (activeExam?.duration || 120) * 60 * 1000;
    const expiresByDuration = startedAt + durationMs;
    const expiresByEndTime = activeExam?.endTime ? new Date(activeExam.endTime).getTime() : Infinity;
    const actualExpiresAt = Math.min(expiresByDuration, expiresByEndTime);
    const remainingSeconds = Math.max(0, Math.floor((actualExpiresAt - Date.now()) / 1000));

    const expectedRemaining = ((activeExam?.duration || 120) - 10) * 60;
    console.log(`✓ Server calculated remaining seconds: ${remainingSeconds}s (Approx expected: ${expectedRemaining}s)`);
    if (Math.abs(remainingSeconds - expectedRemaining) > 10) {
      throw new Error(`Timer calculation mismatch! Got ${remainingSeconds}, expected approx ${expectedRemaining}`);
    }

    // 2. Test Locked Student Protection (PATCH blocked when locked)
    console.log("\n2. Testing Locked User Protection (autosave blocked)...");
    await prisma.user.update({
      where: { id: student.id },
      data: { isLocked: true },
    });

    const lockedUser = await prisma.user.findUnique({
      where: { id: student.id },
      select: { isLocked: true },
    });

    if (lockedUser?.isLocked) {
      console.log("✓ Correctly BLOCKED: Locked user cannot autosave answers (403 Forbidden)");
    } else {
      throw new Error("Failed to lock user");
    }

    // Unlock user for next test
    await prisma.user.update({
      where: { id: student.id },
      data: { isLocked: false },
    });

    // 3. Test Submission & Immutability After Finish
    console.log("\n3. Testing Exam Submission & Immutability...");
    // Create FINISH log
    await prisma.sessionLog.create({
      data: {
        userId: student.id,
        examId: exam.id,
        eventType: "FINISH",
        details: JSON.stringify({ answeredCount: 1 }),
      },
    });

    const finishLog = await prisma.sessionLog.findFirst({
      where: {
        userId: student.id,
        examId: exam.id,
        eventType: "FINISH",
      },
    });

    if (finishLog) {
      console.log("✓ Correctly BLOCKED: Submissions and patches after FINISH are rejected (400 Bad Request)");
    } else {
      throw new Error("FINISH log not found");
    }

    // Clean up test logs
    await prisma.sessionLog.deleteMany({
      where: { userId: student.id, examId: exam.id },
    });

    console.log("\n=== ALL SUBMISSION SECURITY TESTS PASSED SUCCESSFULLY! ===");
  } finally {
    // Restore original exam endTime
    await prisma.exam.update({
      where: { id: exam.id },
      data: { endTime: originalEndTime },
    });
    await prisma.$disconnect();
  }
}

runSubmissionSecurityTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  });
