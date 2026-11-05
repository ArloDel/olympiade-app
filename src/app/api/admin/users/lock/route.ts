import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoMode, isProtectedDemoEmail } from "@/lib/demo";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const callerRole = (session.user as any)?.role;
    if (callerRole !== "ADMIN" && callerRole !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { userId, isLocked } = await req.json();

    if (!userId || typeof isLocked !== 'boolean') {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch target user to check existence and role
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // 2. Strict IDOR / Privilege Protection:
    // Superadmins can NEVER be locked via the regular admin lock endpoint
    if (targetUser.role === "SUPERADMIN") {
      return NextResponse.json(
        { success: false, error: "Tidak dapat mengubah status penguncian akun Superadmin." },
        { status: 403 }
      );
    }

    // Regular Admins can ONLY lock/unlock Students
    if (callerRole === "ADMIN" && targetUser.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Admin hanya memiliki wewenang untuk mengunci atau membuka akses akun Siswa." },
        { status: 403 }
      );
    }

    // 3. Demo Mode Guard for protected accounts
    if (isDemoMode() && isLocked && targetUser.email && isProtectedDemoEmail(targetUser.email)) {
      return NextResponse.json(
        { success: false, error: "Mode Demo: Akun demo utama tidak dapat dikunci." },
        { status: 403 }
      );
    }

    // 4. Update the user's lock status. If unlocking (isLocked: false), reset warnings to 0
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
        role: true,
        isLocked: true,
        warnings: true
      }
    });

    // 5. Audit Log with target role information
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: isLocked ? "LOCK_STUDENT" : "UNLOCK_STUDENT",
        targetId: userId,
        details: JSON.stringify({ name: updatedUser.name, email: updatedUser.email, role: updatedUser.role })
      }
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error("Error updating lock status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
