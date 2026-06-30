import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const answers = await prisma.answer.findMany({
      include: {
        user: { select: { name: true, email: true } },
        question: {
          include: { exam: { select: { title: true } } }
        },
        option: { select: { text: true, isCorrect: true } }
      }
    });

    // Generate CSV
    const headers = [
      "User Name",
      "User Email",
      "Exam Title",
      "Question ID",
      "Question Type",
      "Selected Option",
      "Text Answer",
      "Is Correct (MCQ)",
      "Score",
      "Graded"
    ];

    const rows = answers.map(a => {
      return [
        a.user.name || "-",
        a.user.email || "-",
        a.question.exam.title || "-",
        a.question.id,
        a.question.type,
        a.option ? a.option.text.replace(/"/g, '""') : "-",
        a.textAnswer ? a.textAnswer.replace(/"/g, '""') : "-",
        a.option ? (a.option.isCorrect ? "Yes" : "No") : "-",
        a.score?.toString() || "0",
        a.isGraded ? "Yes" : "No"
      ].map(field => `"${field}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    // Log the export action
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "EXPORT_DATA",
        details: JSON.stringify({ rowsExported: answers.length })
      }
    });

    const response = new NextResponse(csvContent);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set("Content-Disposition", `attachment; filename="exam_results_export_${new Date().toISOString().split('T')[0]}.csv"`);
    
    return response;

  } catch (error: any) {
    console.error("Export error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
