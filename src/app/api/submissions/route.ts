import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo";

async function validateSubmission(userId: string, examId: string, isFinalSubmit: boolean) {
  // 1. Parallel fetch of user status, exam details, and relevant session logs
  const [user, exam, sessionLogs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { isLocked: true, role: true }
    }),
    prisma.exam.findUnique({
      where: { id: examId },
      select: { isActive: true, duration: true, startTime: true, endTime: true }
    }),
    prisma.sessionLog.findMany({
      where: {
        userId,
        examId,
        eventType: { in: ["START", "FINISH"] }
      },
      select: {
        eventType: true,
        createdAt: true
      }
    })
  ]);

  if (!user) {
    return { allowed: false, status: 404, error: "User tidak ditemukan." };
  }

  // 2. Check if already finished
  const finishLog = sessionLogs.find(l => l.eventType === "FINISH");
  if (finishLog) {
    return {
      allowed: false,
      status: 400,
      error: "Ujian ini sudah selesai diserahkan dan tidak dapat diubah lagi."
    };
  }

  // For PATCH (in-progress autosave): if user is locked, block changes
  if (!isFinalSubmit && user.isLocked) {
    return {
      allowed: false,
      status: 403,
      error: "Akun Anda sedang terkunci karena pelanggaran. Jawaban tidak dapat diperbarui."
    };
  }

  // 3. Check exam status & time limit
  if (!exam) {
    return { allowed: false, status: 404, error: "Ujian tidak ditemukan." };
  }

  if (!exam.isActive) {
    return { allowed: false, status: 403, error: "Ujian sedang tidak aktif." };
  }

  // 4. Server-side duration validation with grace period
  const startLog = sessionLogs.find(l => l.eventType === "START");

  const now = Date.now();
  // Allow 3 minutes grace period for network latency / final auto-submit submission
  const GRACE_PERIOD_MS = 3 * 60 * 1000;

  if (startLog) {
    const startedAt = new Date(startLog.createdAt).getTime();
    const maxDurationMs = exam.duration * 60 * 1000 + GRACE_PERIOD_MS;
    if (now > startedAt + maxDurationMs) {
      return {
        allowed: false,
        status: 403,
        error: "Batas durasi waktu pengerjaan ujian telah berakhir."
      };
    }
  }

  if (!isDemoMode() && exam.endTime) {
    const maxEndTimeMs = new Date(exam.endTime).getTime() + GRACE_PERIOD_MS;
    if (now > maxEndTimeMs) {
      return {
        allowed: false,
        status: 403,
        error: "Jadwal penutupan ujian telah berakhir."
      };
    }
  }

  return { allowed: true };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { examId, answers } = body;

    if (!examId || !answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Validate submission integrity (Locked status, finished state, duration limits)
    const validation = await validateSubmission(userId, examId, true);
    if (!validation.allowed) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status || 400 }
      );
    }

    // Use a Prisma transaction to upsert all answers efficiently
    const upserts = Object.entries(answers).map(([questionId, answerData]) => {
      const data = answerData as { optionId?: string, textAnswer?: string };
      return prisma.answer.upsert({
        where: {
          userId_examId_questionId: {
            userId: userId,
            examId: examId,
            questionId: questionId,
          },
        },
        update: {
          optionId: data.optionId || null,
          textAnswer: data.textAnswer || null,
        },
        create: {
          userId: userId,
          examId: examId,
          questionId: questionId,
          optionId: data.optionId || null,
          textAnswer: data.textAnswer || null,
        },
      });
    });

    await prisma.$transaction(upserts);

    // Also record a SessionLog for the finish event
    await prisma.sessionLog.create({
      data: {
        userId,
        examId,
        eventType: "FINISH",
        details: JSON.stringify({ answeredCount: Object.keys(answers).length })
      }
    });

    return NextResponse.json({ success: true, message: "Answers submitted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error submitting answers:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit answers" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { examId, answers } = body;

    if (!examId || !answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Validate submission integrity for autosave
    const validation = await validateSubmission(userId, examId, false);
    if (!validation.allowed) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status || 400 }
      );
    }

    const upserts = Object.entries(answers).map(([questionId, answerData]) => {
      const data = answerData as { optionId?: string, textAnswer?: string };
      return prisma.answer.upsert({
        where: {
          userId_examId_questionId: {
            userId: userId,
            examId: examId,
            questionId: questionId,
          },
        },
        update: {
          optionId: data.optionId || null,
          textAnswer: data.textAnswer || null,
        },
        create: {
          userId: userId,
          examId: examId,
          questionId: questionId,
          optionId: data.optionId || null,
          textAnswer: data.textAnswer || null,
        },
      });
    });

    await prisma.$transaction(upserts);

    return NextResponse.json({ success: true, message: "Progress saved successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error saving progress:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save progress" },
      { status: 500 }
    );
  }
}
