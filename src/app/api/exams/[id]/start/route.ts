import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo";

async function getOrInitStartSession(userId: string, examId: string) {
  // Check if START event already exists
  const existingLog = await prisma.sessionLog.findFirst({
    where: {
      userId,
      examId,
      eventType: "START"
    }
  });

  const startLog = existingLog || await prisma.sessionLog.create({
    data: {
      userId,
      examId,
      eventType: "START",
      details: "Exam started"
    }
  });

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { duration: true, startTime: true, endTime: true, isActive: true }
  });

  if (!exam) {
    return { error: "Exam not found", status: 404 };
  }

  const startedAt = new Date(startLog.createdAt).getTime();
  const durationMs = exam.duration * 60 * 1000;
  const expiresByDuration = startedAt + durationMs;
  const isDemo = isDemoMode();
  const expiresByEndTime = (!isDemo && exam.endTime) ? new Date(exam.endTime).getTime() : Infinity;
  const actualExpiresAt = Math.min(expiresByDuration, expiresByEndTime);
  const now = Date.now();
  const remainingSeconds = Math.max(0, Math.floor((actualExpiresAt - now) / 1000));

  return {
    data: {
      startedAt: startLog.createdAt,
      durationMinutes: exam.duration,
      remainingSeconds,
      isExpired: remainingSeconds <= 0
    }
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const examId = resolvedParams.id;
    const userId = session.user.id;

    const result = await getOrInitStartSession(userId, examId);
    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const examId = resolvedParams.id;
    const userId = session.user.id;

    const result = await getOrInitStartSession(userId, examId);
    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
