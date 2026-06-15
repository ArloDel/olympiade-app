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

    // Fetch the exam and total questions
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: { select: { id: true, points: true, type: true } }
      }
    });

    if (!exam) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    const totalQuestions = exam.questions.length;

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
    let earnedPoints = 0;
    let totalMaxPoints = 0;

    const questionMap = new Map(exam.questions.map(q => [q.id, q]));
    
    exam.questions.forEach(q => {
      totalMaxPoints += q.points;
    });

    answers.forEach(ans => {
      const q = questionMap.get(ans.questionId);
      if (!q) return;

      if (!q.type || q.type === 'MULTIPLE_CHOICE') {
        if (ans.option?.isCorrect) {
          correctAnswers++;
          earnedPoints += q.points;
        } else {
          wrongAnswers++;
        }
      } else {
        // SHORT_ANSWER or ESSAY
        if (ans.isGraded && ans.score !== null) {
          earnedPoints += ans.score;
          if (ans.score > 0) correctAnswers++;
          else wrongAnswers++;
        } else {
          wrongAnswers++;
        }
      }
    });

    const unanswered = totalQuestions - answers.length;
    wrongAnswers += unanswered;

    const score = totalMaxPoints > 0 ? (earnedPoints / totalMaxPoints) * 100 : 0;

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
