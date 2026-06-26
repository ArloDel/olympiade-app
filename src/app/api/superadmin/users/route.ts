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

    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN"
      },
      select: {
        id: true,
        name: true,
        email: true,
        isLocked: true,
      },
      orderBy: {
        name: "asc"
      }
    });

    return NextResponse.json({ success: true, data: admins });
  } catch (error: any) {
    console.error("Error fetching admins:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email } = body;

    if (!email || !name) {
      return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
    }

    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        role: "ADMIN"
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE_ADMIN",
        targetId: newAdmin.id,
        details: JSON.stringify({ name: newAdmin.name, email: newAdmin.email })
      }
    });

    return NextResponse.json({ success: true, data: newAdmin });
  } catch (error: any) {
    console.error("Error creating admin:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
