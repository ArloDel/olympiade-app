import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    // Only ADMIN or SUPERADMIN can access this search
    const role = (session?.user as any)?.role;
    if (!session || (role !== "ADMIN" && role !== "SUPERADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: { exams: [], students: [] } });
    }

    // Search Exams and Students concurrently
    const [exams, students] = await Promise.all([
      prisma.exam.findMany({
        where: {
          title: { contains: query, mode: "insensitive" }
        },
        select: { id: true, title: true, isActive: true },
        take: 5
      }),
      prisma.user.findMany({
        where: {
          role: "STUDENT",
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } }
          ]
        },
        select: { id: true, name: true, email: true },
        take: 5
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        exams,
        students
      }
    });

  } catch (error: any) {
    console.error("Error in global search API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
