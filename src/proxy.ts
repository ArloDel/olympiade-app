import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { checkRateLimit, isMutationMethod } from "@/lib/rate-limit"

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    if (isMutationMethod(req.method)) {
      const rateLimit = checkRateLimit(req)
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: "Terlalu banyak permintaan dalam waktu singkat. Silakan tunggu beberapa detik.",
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateLimit.retryAfterSeconds),
            },
          }
        )
      }
    }
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAuth = !!token
  const isAuthPage = pathname.startsWith("/login")
  const isAdminPage = pathname.startsWith("/admin")
  const isDashboardPage = pathname.startsWith("/dashboard")
  const isSuperadminPage = pathname.startsWith("/superadmin")

  // 1. Jika user sudah login dan mencoba mengakses halaman /login
  if (isAuthPage) {
    if (isAuth) {
      if (token?.role === "SUPERADMIN") {
        return NextResponse.redirect(new URL("/superadmin", req.url))
      }
      if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // 2. Jika user belum login dan mencoba mengakses halaman yang dilindungi
  if (!isAuth && (isAdminPage || isDashboardPage || isSuperadminPage)) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // 3. Pengecekan otorisasi Role
  if (isSuperadminPage && token?.role !== "SUPERADMIN") {
    if (token?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isAdminPage) {
    if (token?.role !== "ADMIN" && token?.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  if (isDashboardPage) {
    if (token?.role === "SUPERADMIN") {
      return NextResponse.redirect(new URL("/superadmin", req.url))
    }
    if (token?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/superadmin/:path*", "/login", "/api/:path*"]
}

