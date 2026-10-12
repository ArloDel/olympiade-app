import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo";

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

    if (isDemoMode()) {
      return NextResponse.json(
        { success: false, error: "Mode Demo: Mengakhiri ujian secara paksa dinonaktifkan pada lingkungan demo." },
        { status: 403 }
      );
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
