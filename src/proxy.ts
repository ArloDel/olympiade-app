import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/login")
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin")
    const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard")

    // 1. Jika user sudah login dan mencoba mengakses halaman /login
    if (isAuthPage) {
      if (isAuth) {
        // Arahkan admin ke /admin, dan role lain ke /dashboard
        if (token?.role === "ADMIN") {
          return NextResponse.redirect(new URL("/admin", req.url))
        }
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
      return null // Izinkan akses ke halaman login jika belum login
    }

    // 2. Jika user belum login dan mencoba mengakses halaman yang dilindungi
    if (!isAuth && (isAdminPage || isDashboardPage)) {
      // Arahkan kembali ke /login secara bersih tanpa parameter from
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // 3. Pengecekan otorisasi Role (Khusus halaman /admin)
    if (isAdminPage && token?.role !== "ADMIN") {
      // Jika bukan ADMIN mencoba masuk ke /admin, tolak dan kembalikan ke /dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url))
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
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login"]
}
