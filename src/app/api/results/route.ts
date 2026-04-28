import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json(
        { success: false, error: "Missing examId parameter" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Fetch the total questions count for the exam
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    const totalQuestions = exam._count.questions;

    // Fetch answers for this user and this exam
    const answers = await prisma.answer.findMany({
      where: {
        userId: userId,
        question: {
          examId: examId
        }
      },
      include: {
        option: true
      }
    });

    let correctAnswers = 0;
    let wrongAnswers = 0;

    answers.forEach(ans => {
      if (ans.option.isCorrect) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    });

    // If the user answered fewer questions than total, the unanaswered are also wrong
    const unanswered = totalQuestions - answers.length;
    wrongAnswers += unanswered;

    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        score: parseFloat(score.toFixed(2)),
        correctAnswers,
        wrongAnswers,
        unanswered,
        totalQuestions
      }
    });

  } catch (error: any) {
    console.error("Error calculating results:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate results" },
      { status: 500 }
    );
  }
}
