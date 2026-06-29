import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { userId, isLocked } = await req.json();

    if (!userId || typeof isLocked !== 'boolean') {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Update the user's lock status. If unlocking (isLocked: false), reset warnings to 0
    const updateData: any = { isLocked };
    if (!isLocked) {
      updateData.warnings = 0;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isLocked: true,
        warnings: true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: isLocked ? "LOCK_STUDENT" : "UNLOCK_STUDENT",
        targetId: userId,
        details: JSON.stringify({ name: updatedUser.name, email: updatedUser.email })
      }
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error("Error updating lock status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
