"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Users, LogOut, Moon, Sun, ShieldAlert, FileText, UserCheck, Activity, BarChart3, Clock, ChevronRight } from "lucide-react"
import { useTheme } from "@/hooks/useTheme";

export default function SuperadminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useTheme()
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAdmins: 0,
    totalExams: 0,
    activeExams: 0,
    recentLogs: [] as any[]
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated" && (session?.user as any)?.role !== "SUPERADMIN") {
      router.replace("/dashboard")
    } else if (status === "authenticated") {
      fetchDashboardData()
    }
  }, [status, router, session])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/superadmin/dashboard")
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  const isDark = theme === "dark"

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', 
      hour: '2-digit', minute: '2-digit'
    }).format(d)
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ')
  }

  const formatDetails = (details: string) => {
    if (!details) return ""
    try {
      const parsed = JSON.parse(details)
      return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ')
    } catch {
      return details
    }
  }

  if (status === "loading" || loading) {
     return (
       <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-transparent' : 'bg-white'}`}>
         <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
       </div>
     )
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-transparent text-zinc-300 selection:bg-indigo-500/30' : 'bg-white text-zinc-600'}`}>
      
      <header className={`sticky top-0 z-30 border-b ${isDark ? 'border-white/10 bg-black/40 backdrop-blur-xl' : 'border-zinc-100 bg-white/80'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className={`font-semibold text-sm tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'bg-amber-500 text-black' : 'bg-amber-600 text-white'}`}>
                <ShieldAlert size={14} />
              </div>
              Superadmin
            </div>
            <nav className="hidden md:flex gap-6 text-sm">
              <Link href="/superadmin" className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Dashboard</Link>
              <Link href="/superadmin/admins" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Kelola Admin</Link>
              <Link href="/superadmin/logs" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Log Aktivitas</Link>
              <Link href="/superadmin/settings" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Pengaturan Global</Link>
              <Link href="/admin" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Panel Admin Reguler</Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`text-xs flex items-center gap-1.5 transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className={`transition-colors ${isDark ? 'text-zinc-600 hover:text-white' : 'text-zinc-300 hover:text-black'}`}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-12">
        
        <div>
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-amber-500' : 'bg-amber-600'} animate-pulse`}></span>
            Ringkasan Global
          </div>
          <h1 className={`text-3xl font-medium tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Welcome back, Superadmin</h1>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Pantau seluruh aktivitas aplikasi dari satu tempat terpusat.</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] ${isDark ? 'glass-panel glow-border' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <Users size={20} />
              </div>
            </div>
            <div className={`text-3xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
              {stats.totalStudents}
            </div>
            <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'} flex items-center gap-1`}>
              Total Siswa Terdaftar
            </div>
          </div>

          <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] ${isDark ? 'glass-panel glow-border' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                <UserCheck size={20} />
              </div>
            </div>
            <div className={`text-3xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
              {stats.totalAdmins}
            </div>
            <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'} flex items-center gap-1`}>
              Total Administrator
            </div>
          </div>

          <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] ${isDark ? 'glass-panel glow-border' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <Activity size={20} />
              </div>
            </div>
            <div className={`text-3xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
              {stats.activeExams}
            </div>
            <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'} flex items-center gap-1`}>
              Ujian Sedang Aktif
            </div>
          </div>

          <div className={`p-6 rounded-2xl border transition-all hover:scale-[1.02] ${isDark ? 'glass-panel glow-border' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                <FileText size={20} />
              </div>
            </div>
            <div className={`text-3xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
              {stats.totalExams}
            </div>
            <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'} flex items-center gap-1`}>
              Total Bank Ujian
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
              <BarChart3 size={18} /> Aktivitas Terbaru
            </h2>
            <Link href="/superadmin/logs" className={`text-xs flex items-center gap-1 transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>
              Lihat semua <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'glass-panel glow-border' : 'bg-white border-zinc-200 shadow-sm'}`}>
            {stats.recentLogs.length === 0 ? (
              <div className={`p-8 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Belum ada aktivitas yang tercatat.
              </div>
            ) : (
              <div className="flex flex-col">
                {stats.recentLogs.map((log, i) => (
                  <div key={log.id} className={`flex items-start gap-4 p-5 ${i !== stats.recentLogs.length - 1 ? (isDark ? 'border-b border-zinc-800' : 'border-b border-zinc-100') : ''}`}>
                    <div className={`mt-0.5 p-1.5 rounded-full ${
                      log.action.includes('DELETE') ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600') :
                      log.action.includes('CREATE') ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') :
                      (isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600')
                    }`}>
                      <Activity size={14} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          {log.user?.name || 'Unknown'}
                        </span>
                        <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          <Clock size={12} /> {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <div className={`text-xs capitalize font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {formatAction(log.action)}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'} line-clamp-1`}>
                        Target: {log.details ? formatDetails(log.details) : (log.targetId || '-')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
