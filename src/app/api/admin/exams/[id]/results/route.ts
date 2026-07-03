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

    // Fetch the exam and total questions
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examQuestions: { 
          include: {
            question: { select: { id: true, points: true, type: true } }
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    const examQuestionsList = exam.examQuestions.map(eq => eq.question);
    const totalQuestions = examQuestionsList.length;

    // Fetch all students including their warnings and session logs for this exam
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { 
        id: true, 
        name: true, 
        email: true,
        warnings: true,
        sessionLogs: {
          where: { examId: examId },
          select: { eventType: true, createdAt: true }
        }
      }
    });

    // Fetch all answers for this exam
    const allAnswers = await prisma.answer.findMany({
      where: {
        examId: examId
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
      let earnedPoints = 0;
      let totalMaxPoints = 0;

      const questionMap = new Map(examQuestionsList.map(q => [q.id, q]));
      
      examQuestionsList.forEach(q => {
        totalMaxPoints += q.points;
      });

      studentAnswers.forEach(ans => {
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
            // Not graded yet counts as 0 points for now
            wrongAnswers++;
          }
        }
      });

      const unanswered = totalQuestions - studentAnswers.length;
      
      // If unanswered > 0, they count as wrong in terms of final score logic, but we track them separately
      const totalWrong = wrongAnswers + unanswered;
      const score = totalMaxPoints > 0 ? (earnedPoints / totalMaxPoints) * 100 : 0;

      // Calculate duration
      let durationStr = "-";
      const startLog = student.sessionLogs.find(l => l.eventType === "START");
      const finishLog = student.sessionLogs.find(l => l.eventType === "FINISH");
      
      if (startLog && finishLog) {
        const diffMs = finishLog.createdAt.getTime() - startLog.createdAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        durationStr = `${diffMins} menit`;
      } else if (studentAnswers.length > 0) {
        durationStr = "Selesai (N/A)";
      }

      return {
        id: student.id,
        name: student.name || "Unknown",
        email: student.email || "No Email",
        duration: durationStr,
        warnings: student.warnings || 0,
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
