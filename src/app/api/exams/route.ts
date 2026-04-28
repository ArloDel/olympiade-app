import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { questions: true }
        },
        ...(userId && {
          sessionLogs: {
            where: {
              userId: userId,
              eventType: "FINISH"
            },
            take: 1
          }
        })
      }
    });

    const examsWithStatus = exams.map(exam => ({
      ...exam,
      isFinished: exam.sessionLogs && exam.sessionLogs.length > 0
    }));

    return NextResponse.json({ success: true, data: examsWithStatus });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, startTime, endTime, duration } = body;

    if (!title || !startTime || !endTime || !duration) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: parseInt(duration, 10),
      },
    });

    return NextResponse.json({ success: true, data: exam }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating exam:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create exam" },
      { status: 500 }
    );
  }
}
