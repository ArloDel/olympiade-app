import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import os from "os";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const uptime = process.uptime(); // in seconds
    const memoryUsage = process.memoryUsage();
    
    // Formatting helper
    const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

    const healthData = {
      status: "OK",
      environment: process.env.NODE_ENV || "development",
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: {
        rss: formatBytes(memoryUsage.rss),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsed: formatBytes(memoryUsage.heapUsed),
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        freeMem: formatBytes(os.freemem()),
        totalMem: formatBytes(os.totalmem()),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: healthData });
  } catch (error: any) {
    console.error("Error fetching system health:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
