import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoMode, isProtectedDemoEmail } from "@/lib/demo";

const WARNING_THRESHOLD = 3;
const VIOLATION_EVENTS = ["TAB_SWITCH", "DEVTOOLS_OPEN", "FULLSCREEN_EXIT", "WINDOW_BLUR"];

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
      select: { email: true, warnings: true, isLocked: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Verify if student already submitted / finished the exam
    const finishLog = await prisma.sessionLog.findFirst({
      where: {
        userId,
        examId,
        eventType: "FINISH"
      }
    });

    if (finishLog) {
      return NextResponse.json(
        { success: false, error: "Ujian telah selesai." },
        { status: 400 }
      );
    }

    const isProtectedDemoUser = isDemoMode() && isProtectedDemoEmail(user.email);

    let updatedWarnings = isProtectedDemoUser
      ? Math.min(user.warnings, WARNING_THRESHOLD - 1)
      : user.warnings;
    let isNowLocked = isProtectedDemoUser ? false : user.isLocked;

    // Process event logic
    const isViolation = VIOLATION_EVENTS.includes(eventType);

    if (isViolation && !isNowLocked) {
      if (isProtectedDemoUser) {
        updatedWarnings = Math.min(user.warnings + 1, WARNING_THRESHOLD - 1);
        isNowLocked = false;
      } else {
        updatedWarnings += 1;
        if (updatedWarnings >= WARNING_THRESHOLD) {
          isNowLocked = true;
        }
      }
      
      // Update user warning count & lock status
      await prisma.user.update({
        where: { id: userId },
        data: { 
          warnings: updatedWarnings,
          isLocked: isNowLocked 
        }
      });

      // Log the violation event
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
    } else if (isProtectedDemoUser && (user.isLocked || user.warnings >= WARNING_THRESHOLD)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          warnings: updatedWarnings,
          isLocked: false
        }
      });
    } else if (eventType === "SNAPSHOT") {
      // Snapshot log without warning increment
      await prisma.sessionLog.create({
        data: {
          userId,
          examId,
          eventType: "SNAPSHOT",
          snapshotUrl: snapshotUrl || null,
          details: details ? JSON.stringify(details) : null
        }
      });
    }

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
