import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    // Unpack params properly since Next 15+ sometimes requires awaiting params.
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (user.role === "SUPERADMIN") {
       return NextResponse.json({ success: false, error: "Cannot delete SUPERADMIN" }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "DELETE_ADMIN",
        targetId: id,
        details: JSON.stringify({ name: user.name, email: user.email })
      }
    });

    return NextResponse.json({ success: true, message: "Admin deleted" });
  } catch (error: any) {
    console.error("Error deleting admin:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
