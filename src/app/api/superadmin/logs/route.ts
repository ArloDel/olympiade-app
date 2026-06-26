import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          }
        }
      },
      take: 100 // Limit to latest 100 for now
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
