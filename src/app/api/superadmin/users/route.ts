import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as any)?.role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
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
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as any)?.role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (isDemoMode()) {
      return NextResponse.json(
        { success: false, error: "Mode Demo: Menambahkan akun admin baru dinonaktifkan pada lingkungan demo portofolio." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !name) {
      return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
    }

    // Hash the password securely with bcrypt
    const rawPassword = typeof password === "string" && password.trim().length >= 6
      ? password.trim()
      : "password123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isLocked: true,
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
