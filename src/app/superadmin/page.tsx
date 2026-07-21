"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Users, ShieldAlert, FileText, UserCheck, Activity, BarChart3, Clock, ChevronRight, Zap, ShieldX, X, TrendingUp, TrendingDown } from "lucide-react"
import { useTheme } from "@/hooks/useTheme";

const MetricCard = ({ title, value, icon: Icon, color, trend, isDark, progress }: any) => {
  const colorMap: any = {
    blue: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600',
    amber: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600',
    emerald: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    purple: isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600',
  }
  const strokeColor: any = {
    blue: '#3b82f6',
    amber: '#f59e0b',
    emerald: '#10b981',
    purple: '#8b5cf6',
  }

  const bgGradientMap: any = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
  }

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((progress || 0) / 100) * circumference;

  return (
    <div className={`relative p-6 rounded-2xl border transition-all hover:scale-[1.02] overflow-hidden ${isDark ? 'glass-panel glow-border' : 'bg-white border-zinc-200 shadow-sm'}`}>
      <div className={`absolute -right-10 -top-10 w-32 h-32 blur-3xl opacity-20 ${bgGradientMap[color]} rounded-full pointer-events-none`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r={radius} className={`${isDark ? 'stroke-white/10' : 'stroke-zinc-200'}`} strokeWidth="4" fill="none" />
            <circle cx="24" cy="24" r={radius} stroke={strokeColor[color]} strokeWidth="4" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
          </svg>
          <span className={`absolute text-[10px] font-bold ${isDark ? 'text-white' : 'text-zinc-700'}`}>{progress || 0}%</span>
        </div>
      </div>
      
      <div className={`text-3xl font-semibold mb-2 relative z-10 ${isDark ? 'text-white' : 'text-black'}`}>
        {value}
      </div>
      
      <div className={`flex items-center justify-between mt-2 relative z-10`}>
        <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {title}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
            trend.isPositive 
              ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') 
              : (isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600')
          }`}>
            {trend.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </div>
        )}
      </div>
    </div>
  )
}


export default function SuperadminDashboard() {
  const [loading, setLoading] = useState(true)
  const [theme] = useTheme()
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAdmins: 0,
    totalExams: 0,
    activeExams: 0,
    recentLogs: [] as any[],
    trends: {
      students: { value: 0, isPositive: true },
      admins: { value: 0, isPositive: true },
      exams: { value: 0, isPositive: true },
      active: { value: 0, isPositive: true }
    }
  })
  
  const [actionLoading, setActionLoading] = useState(false)
  const [healthData, setHealthData] = useState<any>(null)
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

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

  const handlePanicLockAll = async () => {
    if (!confirm("🚨 PERINGATAN KRITIS: Anda akan MENGUNCI SEMUA ADMIN (kecuali Superadmin). Mereka akan langsung ter-logout dan tidak bisa masuk kembali. Apakah Anda yakin?")) return;
    
    setActionLoading(true)
    try {
      const res = await fetch("/api/superadmin/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LOCK_ALL_ADMINS" })
      })
      const data = await res.json()
      if (data.success) {
        alert(`Berhasil mengunci ${data.data.lockedCount} admin.`)
        fetchDashboardData()
      } else {
        alert("Gagal mengunci admin: " + data.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan")
    } finally {
      setActionLoading(false)
    }
  }

  const handleSystemHealth = async () => {
    setActionLoading(true)
    try {
      const res = await fetch("/api/superadmin/health")
      const data = await res.json()
      if (data.success) {
        setHealthData(data.data)
        setIsHealthModalOpen(true)
      } else {
        alert("Gagal mengambil data kesehatan: " + data.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan")
    } finally {
      setActionLoading(false)
    }
  }

  const handleClearOldLogs = async () => {
    if (!confirm("⚠️ Apakah Anda yakin ingin menghapus SEMUA log aktivitas yang usianya lebih dari 30 hari? Tindakan ini tidak dapat dibatalkan.")) return;
    
    setActionLoading(true)
    try {
      const res = await fetch("/api/superadmin/logs", { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        alert(`Berhasil menghapus ${data.data.deletedCount} log usang.`)
        fetchDashboardData()
      } else {
        alert("Gagal menghapus log: " + data.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan")
    } finally {
      setActionLoading(false)
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

  if (loading) {
     return (
       <div className={`min-h-[60vh] flex items-center justify-center`}>
         <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
       </div>
     )
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Quick Actions (Command Center) */}
      <div className={`p-6 rounded-2xl border ${isDark ? 'glass-panel glow-border border-white/10' : 'bg-white border-zinc-200 shadow-sm'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
          <h2 className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={handlePanicLockAll} disabled={actionLoading} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${isDark ? 'bg-black/20 border-white/5 hover:bg-white/10 hover:border-white/20' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'} disabled:opacity-50`}>
            <ShieldX size={24} className="mb-2 text-red-500" />
            <span className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Panic: Lock All</span>
          </button>
          
          <Link href="/superadmin/admins?add=true" className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${isDark ? 'bg-black/20 border-white/5 hover:bg-white/10 hover:border-white/20' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'}`}>
            <UserCheck size={24} className="mb-2 text-emerald-500" />
            <span className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Add Admin</span>
          </Link>

          <button onClick={handleSystemHealth} disabled={actionLoading} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${isDark ? 'bg-black/20 border-white/5 hover:bg-white/10 hover:border-white/20' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'} disabled:opacity-50`}>
            <Activity size={24} className="mb-2 text-blue-500" />
            <span className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>System Health</span>
          </button>
          
          <button onClick={handleClearOldLogs} disabled={actionLoading} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${isDark ? 'bg-black/20 border-white/5 hover:bg-white/10 hover:border-white/20' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'} disabled:opacity-50`}>
            <FileText size={24} className="mb-2 text-purple-500" />
            <span className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Clear Old Logs</span>
          </button>
        </div>
      </div>
        
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
          <MetricCard 
            title="Total Siswa Terdaftar" 
            value={stats.totalStudents} 
            icon={Users} 
            color="blue" 
            trend={stats.trends?.students} 
            isDark={isDark} 
            progress={Math.min(100, Math.max(0, 100 - (stats.totalStudents % 100)))} 
          />
          <MetricCard 
            title="Total Administrator" 
            value={stats.totalAdmins} 
            icon={UserCheck} 
            color="amber" 
            trend={stats.trends?.admins} 
            isDark={isDark} 
            progress={Math.min(100, Math.max(0, stats.totalAdmins * 10))} 
          />
          <MetricCard 
            title="Ujian Sedang Aktif" 
            value={stats.activeExams} 
            icon={Activity} 
            color="emerald" 
            trend={stats.trends?.active} 
            isDark={isDark} 
            progress={stats.totalExams === 0 ? 0 : Math.round((stats.activeExams / stats.totalExams) * 100)} 
          />
          <MetricCard 
            title="Total Bank Ujian" 
            value={stats.totalExams} 
            icon={FileText} 
            color="purple" 
            trend={stats.trends?.exams} 
            isDark={isDark} 
            progress={Math.min(100, Math.max(0, 100 - (stats.totalExams % 100)))} 
          />
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

      {/* System Health Modal */}
      {isHealthModalOpen && healthData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsHealthModalOpen(false)}></div>
          <div className={`relative w-full max-w-md flex flex-col rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'glass-panel glow-border' : 'bg-white border border-zinc-200'}`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
              <h2 className={`text-lg font-medium flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                <Activity size={18} className="text-blue-500" />
                Status Kesehatan Sistem
              </h2>
              <button onClick={() => setIsHealthModalOpen(false)} className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-y-3">
                <div className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Status:</div>
                <div className={`font-medium ${healthData.status === 'OK' ? 'text-emerald-500' : 'text-rose-500'}`}>{healthData.status}</div>
                
                <div className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Environment:</div>
                <div className={`font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{healthData.environment}</div>
                
                <div className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Uptime:</div>
                <div className={`font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{healthData.uptime}</div>
              </div>

              <div className={`pt-4 mt-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <div className={`font-medium mb-3 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Penggunaan Memori (RAM)</div>
                <div className="grid grid-cols-2 gap-y-3">
                  <div className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>RSS:</div>
                  <div className={`font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{healthData.memory.rss}</div>
                  
                  <div className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Heap Total:</div>
                  <div className={`font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{healthData.memory.heapTotal}</div>
                  
                  <div className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Heap Used:</div>
                  <div className={`font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{healthData.memory.heapUsed}</div>
                </div>
              </div>

              <div className={`pt-4 mt-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <div className={`font-medium mb-3 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Informasi Server</div>
                <div className="grid grid-cols-2 gap-y-3">
                  <div className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Platform:</div>
                  <div className={`font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{healthData.system.platform} ({healthData.system.arch})</div>
                  
                  <div className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Total CPU:</div>
                  <div className={`font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{healthData.system.cpus} Cores</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
