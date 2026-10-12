import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDemoMode, PROTECTED_DEMO_EMAILS } from "@/lib/demo";

async function performDemoReset() {
  if (!isDemoMode()) {
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden: Endpoint reset demo hanya aktif saat NEXT_PUBLIC_DEMO_MODE=true.",
      },
      { status: 403 }
    );
  }

  try {
    const [deletedAnswers, deletedLogs, unlockedUsers] = await prisma.$transaction([
      prisma.answer.deleteMany({
        where: {
          user: {
            email: "student@olym.app",
          },
        },
      }),
      prisma.sessionLog.deleteMany({
        where: {
          user: {
            email: "student@olym.app",
          },
        },
      }),
      prisma.user.updateMany({
        where: {
          OR: [
            { role: "STUDENT" },
            { email: { in: [...PROTECTED_DEMO_EMAILS] } },
          ],
        },
        data: {
          isLocked: false,
          warnings: 0,
        },
      }),
      prisma.systemSetting.upsert({
        where: { key: "maintenanceMode" },
        update: { value: "false" },
        create: { key: "maintenanceMode", value: "false" },
      }),
    ]);

    let reactivatedExamId: string | null = null;
    const activeExamCount = await prisma.exam.count({
      where: { isActive: true },
    });

    if (activeExamCount === 0) {
      const primaryExam =
        (await prisma.exam.findFirst({
          where: { examQuestions: { some: {} } },
          orderBy: { createdAt: "desc" },
        })) ??
        (await prisma.exam.findFirst({
          orderBy: { createdAt: "desc" },
        }));

      if (primaryExam) {
        await prisma.exam.update({
          where: { id: primaryExam.id },
          data: { isActive: true },
        });
        reactivatedExamId = primaryExam.id;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data simulasi demo berhasil direset ke kondisi awal.",
      data: {
        deletedAnswers: deletedAnswers.count,
        deletedSessionLogs: deletedLogs.count,
        unlockedUsers: unlockedUsers.count,
        reactivatedExamId,
      },
    });
  } catch (error: any) {
    console.error("Failed to reset demo data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mereset data demo.",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return performDemoReset();
}

export async function GET() {
  return performDemoReset();
}
