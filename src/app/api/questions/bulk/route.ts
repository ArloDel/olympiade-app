import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId, questions } = body;

    if (!examId || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields or invalid format" },
        { status: 400 }
      );
    }

    // Wrap in a transaction to ensure all questions and options are created together safely
    const result = await prisma.$transaction(async (tx) => {
      const createdQuestions = [];

      for (const q of questions) {
        const questionType = q.type || "MULTIPLE_CHOICE";
        
        const question = await tx.question.create({
          data: {
            examId,
            text: q.text,
            order: q.order,
            type: questionType,
            points: q.points !== undefined ? parseFloat(q.points) : 1,
            correctAnswer: questionType === "SHORT_ANSWER" ? q.correctAnswer : null,
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
