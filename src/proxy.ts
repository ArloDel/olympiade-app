import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/login")
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin")
    const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard")
    const isSuperadminPage = req.nextUrl.pathname.startsWith("/superadmin")

    // 1. Jika user sudah login dan mencoba mengakses halaman /login
    if (isAuthPage) {
      if (isAuth) {
        if (token?.role === "SUPERADMIN") {
          return NextResponse.redirect(new URL("/superadmin", req.url))
        }
        // Arahkan admin ke /admin, dan role lain ke /dashboard
        if (token?.role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", req.url))
        }
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
      return null // Izinkan akses ke halaman login jika belum login
    }

    // 2. Jika user belum login dan mencoba mengakses halaman yang dilindungi
    if (!isAuth && (isAdminPage || isDashboardPage || isSuperadminPage)) {
      // Arahkan kembali ke /login secara bersih tanpa parameter from
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // 3. Pengecekan otorisasi Role
    if (isSuperadminPage && token?.role !== "SUPERADMIN") {
      // Hanya SUPERADMIN yang bisa masuk ke /superadmin
      if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    if (isAdminPage) {
      // ADMIN dan SUPERADMIN bisa masuk ke /admin
      if (token?.role !== "ADMIN" && token?.role !== "SUPERADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }

    if (isDashboardPage) {
      // Cegah ADMIN dan SUPERADMIN masuk ke halaman murid
      if (token?.role === "SUPERADMIN") {
        return NextResponse.redirect(new URL("/superadmin", req.url))
      }
      if (token?.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
    }

    return null // Lanjutkan permintaan (request) seperti biasa
  },
  {
    callbacks: {
      // Memaksa middleware function di atas untuk mengeksekusi semua logika pengecekan
      authorized: () => true,
    },
  }
)

// Menentukan rute mana saja yang akan diawasi oleh middleware ini
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/superadmin/:path*", "/login"]
}
