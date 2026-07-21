import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();

    if (action === "TOGGLE_MAINTENANCE") {
      const currentSetting = await prisma.systemSetting.findUnique({
        where: { key: "maintenanceMode" }
      });
      
      const newStatus = currentSetting?.value === "true" ? "false" : "true";

      await prisma.systemSetting.upsert({
        where: { key: "maintenanceMode" },
        update: { value: newStatus },
        create: { key: "maintenanceMode", value: newStatus }
      });

      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: "TOGGLE_MAINTENANCE",
          details: JSON.stringify({ maintenanceMode: newStatus })
        }
      });

      return NextResponse.json({ success: true, data: { maintenanceMode: newStatus } });
    }

    if (action === "STOP_ALL_EXAMS") {
      const result = await prisma.exam.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });

      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: "STOP_ALL_EXAMS",
          details: JSON.stringify({ examsStopped: result.count })
        }
      });

      return NextResponse.json({ success: true, data: { stoppedCount: result.count } });
    }

    if (action === "LOCK_ALL_ADMINS") {
      const result = await prisma.user.updateMany({
        where: { 
          role: "ADMIN",
          isLocked: false, 
        },
        data: { isLocked: true }
      });

      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: "LOCK_ALL_ADMINS",
          details: JSON.stringify({ adminsLocked: result.count })
        }
      });

      return NextResponse.json({ success: true, data: { lockedCount: result.count } });
    }
    
    // GET_MAINTENANCE (to fetch current status)
    if (action === "GET_MAINTENANCE") {
      const currentSetting = await prisma.systemSetting.findUnique({
        where: { key: "maintenanceMode" }
      });
      return NextResponse.json({ success: true, data: { maintenanceMode: currentSetting?.value === "true" } });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Emergency action error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
