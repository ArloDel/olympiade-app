import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { isLocked } = body;

    if (typeof isLocked !== 'boolean') {
      return NextResponse.json({ success: false, error: "isLocked must be a boolean" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (user.role === "SUPERADMIN") {
       return NextResponse.json({ success: false, error: "Cannot lock SUPERADMIN" }, { status: 403 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isLocked }
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error("Error locking admin:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
