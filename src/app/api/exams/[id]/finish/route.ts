import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPERADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const finishedExam = await prisma.exam.update({
      where: { id },
      data: { 
        isActive: false,
        endTime: new Date() // Set end time to now
      }
    });

    return NextResponse.json({ success: true, data: finishedExam });
  } catch (error: any) {
    console.error("Error finishing exam:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to finish exam" },
      { status: 500 }
    );
  }
}
