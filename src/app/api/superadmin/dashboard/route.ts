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

    const [totalStudents, totalAdmins, totalExams, activeExams, recentLogs] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.exam.count(),
      prisma.exam.count({ where: { isActive: true } }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        totalAdmins,
        totalExams,
        activeExams,
        recentLogs,
        trends: {
          students: { value: 12, isPositive: true },
          admins: { value: 2, isPositive: true },
          exams: { value: 5, isPositive: true },
          active: { value: 8, isPositive: false } // e.g. -8%
        }
      }
    });
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
