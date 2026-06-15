import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json({ success: false, error: "Missing examId" }, { status: 400 });
    }

    // Ambil jawaban yang butuh dinilai manual (selain pilihan ganda)
    const answersToGrade = await prisma.answer.findMany({
      where: {
        question: {
          examId: examId,
          type: { in: ['SHORT_ANSWER', 'ESSAY'] }
        }
      },
      include: {
        question: {
          select: { text: true, type: true, correctAnswer: true, points: true }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json({ success: true, data: answersToGrade });
  } catch (error: any) {
    console.error("Error fetching grading data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { answerId, score } = body;

    if (!answerId || score === undefined) {
      return NextResponse.json({ success: false, error: "Missing answerId or score" }, { status: 400 });
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        score: parseFloat(score),
        isGraded: true
      }
    });

    return NextResponse.json({ success: true, data: updatedAnswer });
  } catch (error: any) {
    console.error("Error saving score:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
