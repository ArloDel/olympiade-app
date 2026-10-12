import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any)?.role;
    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT"
      },
      select: {
        id: true,
        name: true,
        email: true,
        isLocked: true,
        warnings: true,
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error: any) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
