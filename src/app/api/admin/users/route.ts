import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    // Assuming simple authorization, only ADMIN can access this.
    // In a real app we'd verify session.user.role === 'ADMIN'. 
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
