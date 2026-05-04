import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || !session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const examId = resolvedParams.id;
    const userId = session.user.id;

    // Check if START event already exists
    const existingLog = await prisma.sessionLog.findFirst({
      where: {
        userId,
        examId,
        eventType: "START"
      }
    });

    if (!existingLog) {
      await prisma.sessionLog.create({
        data: {
          userId,
          examId,
          eventType: "START",
          details: "Exam started"
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
