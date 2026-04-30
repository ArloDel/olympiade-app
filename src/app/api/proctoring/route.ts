import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const WARNING_THRESHOLD = 3;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { examId, eventType, details, snapshotUrl } = body;

    if (!examId || !eventType) {
      return NextResponse.json(
        { success: false, error: "Missing examId or eventType" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check current user status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { warnings: true, isLocked: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    let updatedWarnings = user.warnings;
    let isNowLocked = user.isLocked;

    // Process event logic
    if (eventType === "TAB_SWITCH" && !user.isLocked) {
      updatedWarnings += 1;
      if (updatedWarnings >= WARNING_THRESHOLD) {
        isNowLocked = true;
      }
      
      // Update user warning count & lock status
      await prisma.user.update({
        where: { id: userId },
        data: { 
          warnings: updatedWarnings,
          isLocked: isNowLocked 
        }
      });
    }

    // Log the event
    await prisma.sessionLog.create({
      data: {
        userId,
        examId,
        eventType: isNowLocked && !user.isLocked ? "LOCKED" : eventType,
        snapshotUrl: snapshotUrl || null,
        details: JSON.stringify({ 
          ...details, 
          warningsCount: updatedWarnings 
        })
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        warnings: updatedWarnings, 
        isLocked: isNowLocked 
      } 
    });

  } catch (error: any) {
    console.error("Proctoring API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process proctoring event" },
      { status: 500 }
    );
  }
}
