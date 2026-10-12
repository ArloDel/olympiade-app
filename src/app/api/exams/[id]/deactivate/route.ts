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
        { success: false, error: "Mode Demo: Menonaktifkan ujian dinonaktifkan pada lingkungan demo." },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const deactivatedExam = await prisma.exam.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, data: deactivatedExam });
  } catch (error: any) {
    console.error("Error deactivating exam:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to deactivate exam" },
      { status: 500 }
    );
  }
}
