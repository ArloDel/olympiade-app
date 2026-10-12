import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any)?.role;
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (isDemoMode()) {
      return NextResponse.json(
        { success: false, error: "Mode Demo: Import soal massal dinonaktifkan pada lingkungan demo portofolio." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { examId, questions } = body;

    if (!examId || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields or invalid format" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdQuestions = [];

      for (const q of questions) {
        const questionType = q.type || "MULTIPLE_CHOICE";
        
        const question = await tx.question.create({
          data: {
            text: q.text,
            type: questionType,
            points: q.points !== undefined ? parseFloat(q.points) : 1,
            correctAnswer: questionType === "SHORT_ANSWER" ? q.correctAnswer : null,
            difficulty: "MEDIUM",
            examQuestions: {
              create: {
                examId,
                order: q.order
              }
            },
            ...(questionType === "MULTIPLE_CHOICE" && q.options && Array.isArray(q.options) ? {
              options: {
                create: q.options.map((opt: any) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                })),
              }
            } : {})
          },
        });
        createdQuestions.push(question);
      }
      return createdQuestions;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Error bulk creating questions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to bulk create questions" },
      { status: 500 }
    );
  }
}
