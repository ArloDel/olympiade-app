import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    // Safety check - ONLY allow in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ success: false, error: "Forbidden: Only available in development environment" }, { status: 403 });
    }

    const { examId } = await req.json();
    if (!examId) {
      return NextResponse.json({ success: false, error: "Missing examId" }, { status: 400 });
    }

    const userId = session.user.id;

    // Delete all answers for this user and exam
    await prisma.answer.deleteMany({
      where: {
        userId,
        question: { examId }
      }
    });

    // Delete all session logs for this user and exam
    await prisma.sessionLog.deleteMany({
      where: {
        userId,
        examId
      }
    });

    return NextResponse.json({ success: true, message: "Exam progress reset successfully" });
  } catch (error: any) {
    console.error("Failed to reset exam progress:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
