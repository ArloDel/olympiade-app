import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any)?.role;
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    // First, deactivate all exams
    await prisma.exam.updateMany({
      data: { isActive: false }
    });

    // Then activate the selected exam
    const activatedExam = await prisma.exam.update({
      where: { id },
      data: { isActive: true }
    });

    return NextResponse.json({ success: true, data: activatedExam });
  } catch (error: any) {
    console.error("Error activating exam:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to activate exam" },
      { status: 500 }
    );
  }
}
