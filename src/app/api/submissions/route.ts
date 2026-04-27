import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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

    // Use a Prisma transaction to upsert all answers efficiently
    const upserts = Object.entries(answers).map(([questionId, optionId]) => {
      return prisma.answer.upsert({
        where: {
          userId_questionId: {
            userId: userId,
            questionId: questionId,
          },
        },
        update: {
          optionId: optionId as string,
        },
        create: {
          userId: userId,
          questionId: questionId,
          optionId: optionId as string,
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
