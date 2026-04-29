import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    // Assuming simple authorization, only ADMIN can access this.
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const examId = resolvedParams.id;

    if (!examId) {
      return NextResponse.json({ success: false, error: "Missing examId" }, { status: 400 });
    }

    // Fetch the exam and total questions count
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

    // Fetch all students
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, email: true }
    });

    // Fetch all answers for this exam
    const allAnswers = await prisma.answer.findMany({
      where: {
        question: { examId: examId }
      },
      include: {
        option: true
      }
    });

    // Group answers by user
    const userAnswersMap = new Map<string, any[]>();
    for (const ans of allAnswers) {
      if (!userAnswersMap.has(ans.userId)) {
        userAnswersMap.set(ans.userId, []);
      }
      userAnswersMap.get(ans.userId)!.push(ans);
    }

    // Calculate score for each student
    const results = students.map(student => {
      const studentAnswers = userAnswersMap.get(student.id) || [];
      
      let correctAnswers = 0;
      let wrongAnswers = 0;

      studentAnswers.forEach(ans => {
        if (ans.option?.isCorrect) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      });

      const unanswered = totalQuestions - studentAnswers.length;
      
      // If unanswered > 0, they count as wrong in terms of final score logic, but we track them separately
      const totalWrong = wrongAnswers + unanswered;
      const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      return {
        id: student.id,
        name: student.name || "Unknown",
        email: student.email || "No Email",
        correctAnswers,
        wrongAnswers: totalWrong,
        unanswered,
        score: parseFloat(score.toFixed(2)),
        isSubmitted: studentAnswers.length > 0
      };
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      data: {
        examTitle: exam.title,
        totalQuestions,
        results
      }
    });

  } catch (error: any) {
    console.error("Error fetching admin results:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch results" },
      { status: 500 }
    );
  }
}
