import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json(
        { success: false, error: "examId is required" },
        { status: 400 }
      );
    }

    const questions = await prisma.question.findMany({
      where: { examId },
      include: {
        options: true,
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, data: questions });
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { examId, text, order, options } = body;

    if (!examId || !text || order === undefined || !options || !Array.isArray(options)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields or invalid format" },
        { status: 400 }
      );
    }

    // Wrap in a transaction or use nested create
    const question = await prisma.question.create({
      data: {
        examId,
        text,
        order,
        options: {
          create: options.map((opt: any) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json({ success: true, data: question }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create question" },
      { status: 500 }
    );
  }
}
