"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Users, LogOut, Moon, Sun, ShieldAlert, FileText, UserCheck, Activity, Settings, Menu, X, ChevronRight } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [theme, setTheme] = useTheme()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const isDark = theme === "dark"

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated" && (session?.user as any)?.role !== "SUPERADMIN") {
      router.replace("/dashboard")
    }
  }, [status, router, session])

  if (status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
        <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-700 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
      </div>
    )
  }

  if (status !== "authenticated" || (session?.user as any)?.role !== "SUPERADMIN") {
    return null;
  }

  const navLinks = [
    { name: "Dashboard", href: "/superadmin", icon: <Activity size={18} /> },
    { name: "Kelola Admin", href: "/superadmin/admins", icon: <UserCheck size={18} /> },
    { name: "Log Aktivitas", href: "/superadmin/logs", icon: <FileText size={18} /> },
    { name: "Pengaturan", href: "/superadmin/settings", icon: <Settings size={18} /> },
  ]

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-zinc-300 selection:bg-indigo-500/30' : 'bg-zinc-50 text-zinc-600'}`}>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isDark ? 'bg-black/40 border-r border-white/10 glass-panel' : 'bg-white border-r border-zinc-200 shadow-sm'}`}>
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-white/10 shrink-0">
          <div className={`font-semibold text-sm tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
            <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'bg-amber-500 text-black' : 'bg-amber-600 text-white'}`}>
              <ShieldAlert size={14} />
            </div>
            Superadmin
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="ml-auto lg:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className={`text-xs font-semibold uppercase tracking-wider mb-4 px-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Menu Utama
          </div>
          
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link 
                key={link.name} 
                href={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive 
                    ? (isDark ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' : 'bg-zinc-100 text-black shadow-sm ring-1 ring-zinc-200')
                    : (isDark ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900')
                }`}
              >
                <div className={`${isActive ? (isDark ? 'text-amber-400' : 'text-amber-600') : ''}`}>
                  {link.icon}
                </div>
                {link.name}
              </Link>
            )
          })}

          <div className="pt-8 pb-2">
            <div className={`text-xs font-semibold uppercase tracking-wider mb-4 px-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Lainnya
            </div>
            <Link 
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${isDark ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
            >
              <div className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                <Users size={18} />
              </div>
              Panel Admin Reguler
            </Link>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-white/10 shrink-0 space-y-2">
          <button 
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${isDark ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
          </button>
          
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
          >
            <LogOut size={18} />
            Keluar (Sign Out)
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header (Only visible on small screens) */}
        <header className={`lg:hidden h-16 flex items-center px-4 border-b shrink-0 ${isDark ? 'bg-black/40 border-white/10 backdrop-blur-xl' : 'bg-white border-zinc-200'}`}>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className={`p-2 -ml-2 rounded-lg ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'}`}
          >
            <Menu size={24} />
          </button>
          <div className={`ml-3 font-semibold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
            <ShieldAlert size={16} className={isDark ? 'text-amber-500' : 'text-amber-600'} />
            Superadmin
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  )
}
