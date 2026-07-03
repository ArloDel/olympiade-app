import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role || "STUDENT";

    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { examId, questionIds } = body;

    if (!examId || !questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { success: false, error: "Missing examId or questionIds array" },
        { status: 400 }
      );
    }

    // Get current max order
    const maxOrderRes = await prisma.examQuestion.aggregate({
      where: { examId },
      _max: { order: true }
    });
    
    let currentOrder = (maxOrderRes._max.order || 0) + 1;
    
    const creates = [];
    for (const qId of questionIds) {
      // Check if already linked
      const existing = await prisma.examQuestion.findFirst({
        where: { examId, questionId: qId }
      });
      
      if (!existing) {
        creates.push({
          examId,
          questionId: qId,
          order: currentOrder++
        });
      }
    }

    if (creates.length > 0) {
      await prisma.examQuestion.createMany({
        data: creates
      });
    }

    return NextResponse.json({ success: true, message: `Linked ${creates.length} questions` }, { status: 200 });
  } catch (error: any) {
    console.error("Error linking questions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to link questions" },
      { status: 500 }
    );
  }
}
