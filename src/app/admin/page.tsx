"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Users, AlertTriangle, CheckCircle, Video, LogOut, Search, Activity, ShieldCheck, ShieldAlert, Lock, Moon, Sun, Eye, Clock, Image as ImageIcon, X, TrendingUp, TrendingDown, FileText } from "lucide-react"
import { useTheme } from "@/hooks/useTheme";
import jsPDF from "jspdf"
import "jspdf-autotable"

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
          <div className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${trend.isPositive
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

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useTheme()

  // Log viewer state
  const [selectedLogUser, setSelectedLogUser] = useState<any>(null)
  const [userLogs, setUserLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchParticipants()
    }
  }, [status, router])

  const fetchParticipants = async () => {
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      if (data.success) {
        setParticipants(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch participants:", err)
    } finally {
      setLoading(false)
    }
  }

  const openLogViewer = async (user: any) => {
    setSelectedLogUser(user)
    setLoadingLogs(true)
    setUserLogs([])
    try {
      const res = await fetch(`/api/admin/users/${user.id}/logs`)
      const data = await res.json()
      if (data.success) {
        setUserLogs(data.data)
      } else {
        alert("Gagal memuat log: " + data.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingLogs(false)
    }
  }

  const exportLogsToPDF = () => {
    if (!selectedLogUser || userLogs.length === 0) return
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text("Laporan Aktivitas Peserta Ujian - OlymApp", 14, 20)
    
    doc.setFontSize(12)
    doc.text(`Nama: ${selectedLogUser.name}`, 14, 28)
    doc.text(`Email: ${selectedLogUser.email}`, 14, 34)
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 40)

    const headers = [["Waktu", "Tipe Aktivitas", "Keterangan"]]
    const data = userLogs.map(log => {
      let keterangan = "Aktivitas dicatat."
      try {
        if (log.details) {
          const parsed = JSON.parse(log.details)
          if (log.eventType === 'TAB_SWITCH') {
            keterangan = `Berpindah tab/aplikasi (Peringatan ke-${parsed.warningsCount || 1})`
          } else if (log.eventType === 'LOCKED') {
            keterangan = `Akun dikunci (Total peringatan: ${parsed.warningsCount || 3})`
          } else {
            keterangan = parsed.message || "Aktivitas mencurigakan."
          }
        }
      } catch (e) {}
      return [
        new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        log.eventType,
        keterangan
      ]
    })
    
    ;(doc as any).autoTable({
      startY: 46,
      head: headers,
      body: data,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 41, 41] },
    })

    doc.save(`Log_${selectedLogUser.name.replace(/\s+/g, "_")}.pdf`)
  }

  const getEventTypeColor = (type: string, isDark: boolean) => {
    switch (type) {
      case 'TAB_SWITCH': return isDark ? 'text-amber-500' : 'text-amber-600'
      case 'LOCKED': return isDark ? 'text-rose-500' : 'text-rose-600'
      case 'START': return isDark ? 'text-emerald-500' : 'text-emerald-600'
      case 'FINISH': return isDark ? 'text-blue-500' : 'text-blue-600'
      default: return isDark ? 'text-zinc-400' : 'text-zinc-500'
    }
  }

  const toggleLock = async (userId: string, currentLockStatus: boolean) => {
    try {
      const newStatus = !currentLockStatus
      const res = await fetch("/api/admin/users/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isLocked: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        setParticipants(prev => prev.map(p =>
          p.id === userId
            ? { ...p, isLocked: data.data.isLocked, warnings: data.data.warnings }
            : p
        ))
      } else {
        alert("Gagal mengubah status lock: " + data.error)
      }
    } catch (err) {
      console.error("Error toggling lock:", err)
      alert("Terjadi kesalahan sistem")
    }
  }

  const getStatusColor = (s: string, isDark: boolean) => {
    if (s === 'safe') return isDark ? 'text-emerald-500' : 'text-emerald-600'
    if (s === 'warning') return isDark ? 'text-amber-500' : 'text-amber-600'
    if (s === 'danger') return isDark ? 'text-rose-500' : 'text-rose-600'
    return isDark ? 'text-zinc-500' : 'text-zinc-500'
  }

  const getParticipantStatus = (p: any) => {
    if (p.isLocked) return 'danger'
    if (p.warnings >= 3) return 'danger'
    if (p.warnings > 0) return 'warning'
    return 'safe'
  }

  const filteredParticipants = participants.filter(p =>
    (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalUsers = participants.length;
  const safeUsers = participants.filter(p => getParticipantStatus(p) === 'safe').length;
  const warningUsers = participants.filter(p => getParticipantStatus(p) === 'warning').length;
  const lockedUsers = participants.filter(p => getParticipantStatus(p) === 'danger').length;

  const isDark = theme === "dark"

  return (
    <>
      <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-zinc-500' : 'bg-zinc-400'} animate-pulse`}></span>
              Live Monitoring
            </div>
            <h1 className={`text-3xl font-medium tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Monitoring Peserta</h1>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Pantau aktivitas ujian secara real-time tanpa hambatan.</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} size={16} />
            <input
              type="text"
              placeholder="Cari peserta..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 text-sm outline-none transition-colors border-b ${isDark ? 'bg-transparent border-zinc-800 text-white placeholder-zinc-600 focus:border-white' : 'bg-transparent border-zinc-200 text-black placeholder-zinc-400 focus:border-black'}`}
            />
          </div>
        </div>

        {/* Visual Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard
            title="Total Peserta"
            value={loading ? "-" : totalUsers}
            icon={Users}
            color="blue"
            isDark={isDark}
            progress={100}
            trend={{ value: 12, isPositive: true }}
          />
          <MetricCard
            title="Status Aman"
            value={loading ? "-" : safeUsers}
            icon={Activity}
            color="emerald"
            isDark={isDark}
            progress={totalUsers > 0 ? Math.round((safeUsers / totalUsers) * 100) : 0}
            trend={{ value: 8, isPositive: true }}
          />
          <MetricCard
            title="Peringatan"
            value={loading ? "-" : warningUsers}
            icon={ShieldAlert}
            color="amber"
            isDark={isDark}
            progress={totalUsers > 0 ? Math.round((warningUsers / totalUsers) * 100) : 0}
            trend={{ value: 2, isPositive: false }}
          />
          <MetricCard
            title="Terkunci"
            value={loading ? "-" : lockedUsers}
            icon={Lock}
            color="purple"
            isDark={isDark}
            progress={totalUsers > 0 ? Math.round((lockedUsers / totalUsers) * 100) : 0}
            trend={{ value: 5, isPositive: false }}
          />
        </div>

        {/* Flat List Participants */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Table Header Equivalent */}
            <div className={`grid grid-cols-12 gap-4 pb-4 text-xs font-medium uppercase tracking-widest border-b ${isDark ? 'text-zinc-600 border-zinc-900' : 'text-zinc-400 border-zinc-100'}`}>
              <div className="col-span-5 md:col-span-4">Peserta</div>
              <div className="col-span-4 md:col-span-3">Status</div>
              <div className="col-span-3 md:col-span-2 text-center">Aktivitas</div>
              <div className="hidden md:block md:col-span-3 text-right">Tindakan</div>
            </div>

            {filteredParticipants.map(p => {
              const pStatus = getParticipantStatus(p)
              return (
                <div key={p.id} className={`grid grid-cols-12 gap-4 py-4 items-center border-b transition-colors ${isDark ? 'border-zinc-900 hover:bg-zinc-900/30' : 'border-zinc-50 hover:bg-zinc-50'}`}>

                  <div className="col-span-5 md:col-span-4 flex flex-col pr-2">
                    <span className={`text-sm font-medium truncate ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{p.name}</span>
                    <span className={`text-xs truncate ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{p.email}</span>
                  </div>

                  <div className="col-span-4 md:col-span-3 flex items-center">
                    <span className={`text-xs font-medium capitalize flex items-center gap-2 ${getStatusColor(pStatus, isDark)}`}>
                      {p.isLocked ? "Terkunci" : pStatus === 'warning' ? "Peringatan" : "Aman"}
                      {p.warnings > 0 && !p.isLocked && ` (${p.warnings})`}
                    </span>
                  </div>

                  <div className="col-span-3 md:col-span-2 flex justify-center">
                    {p.isLocked ? (
                      <Video size={16} className={isDark ? 'text-rose-500' : 'text-rose-500'} />
                    ) : (
                      <Video size={16} className={isDark ? 'text-zinc-500' : 'text-zinc-300'} />
                    )}
                  </div>

                  <div className="hidden md:flex md:col-span-3 justify-end gap-2">
                    <button
                      onClick={() => openLogViewer(p)}
                      className={`text-xs font-medium px-3 py-2 rounded transition-colors flex items-center gap-1.5 ${isDark ? "bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800" : "bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200"
                        }`}
                    >
                      <Eye size={14} /> Log
                    </button>
                    <button
                      onClick={() => toggleLock(p.id, p.isLocked)}
                      className={`text-xs font-medium px-4 py-2 rounded transition-colors ${p.isLocked
                        ? isDark ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-zinc-200 text-black hover:bg-zinc-300"
                        : isDark ? "border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600" : "border border-zinc-200 text-zinc-500 hover:text-black hover:border-zinc-400"
                        }`}
                    >
                      {p.isLocked ? "Buka Akses" : "Kunci"}
                    </button>
                  </div>
                </div>
              )
            })}

            {filteredParticipants.length === 0 && (
              <div className={`py-12 text-center text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Tidak ada peserta yang ditemukan.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Log Viewer Modal */}
      {selectedLogUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLogUser(null)}></div>
          <div className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'glass-panel glow-border' : 'bg-white border border-zinc-100'}`}>

            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
              <div>
                <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-black'}`}>Log Bukti: {selectedLogUser.name}</h2>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{selectedLogUser.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={exportLogsToPDF}
                  disabled={loadingLogs || userLogs.length === 0}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors rounded disabled:cursor-not-allowed flex items-center gap-1.5 ${
                    isDark 
                      ? 'bg-rose-900/20 text-rose-500 hover:bg-rose-900/40 disabled:bg-zinc-900 disabled:text-zinc-600' 
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:bg-zinc-100 disabled:text-zinc-400'
                  }`}
                >
                  <FileText size={14} /> Cetak PDF
                </button>
                <button onClick={() => setSelectedLogUser(null)} className={`transition-colors p-1 rounded-full ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:text-black hover:bg-zinc-100'}`}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingLogs ? (
                <div className="flex justify-center py-10">
                  <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
                </div>
              ) : userLogs.length === 0 ? (
                <div className={`text-center py-10 text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Tidak ada log aktivitas untuk peserta ini.
                </div>
              ) : (
                <div className={`relative ml-3 space-y-8 pb-4 border-l ${isDark ? 'border-zinc-900' : 'border-zinc-100'}`}>
                  {userLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <div className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 ${isDark ? 'bg-[#0a0a0a] border-zinc-700' : 'bg-white border-zinc-300'}`}></div>

                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${getEventTypeColor(log.eventType, isDark)}`}>
                          {log.eventType}
                        </span>
                        <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                          <Clock size={12} />
                          {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <div className={`text-sm mb-3 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {(() => {
                          try {
                            if (!log.details) return "Aktivitas dicatat.";
                            const parsed = JSON.parse(log.details);
                            let text = "";
                            if (log.eventType === 'TAB_SWITCH') {
                              text = `Peserta terdeteksi berpindah tab atau aplikasi. (Peringatan ke-${parsed.warningsCount || 1})`;
                            } else if (log.eventType === 'LOCKED') {
                              text = `Akun otomatis dikunci karena terlalu banyak peringatan (Total: ${parsed.warningsCount || 3}).`;
                            } else {
                              text = parsed.message || "Aktivitas mencurigakan dicatat.";
                            }
                            return text;
                          } catch (e) {
                            return log.details;
                          }
                        })()}
                      </div>

                      {log.snapshotUrl && (
                        <div className="mt-2">
                          <img
                            src={log.snapshotUrl}
                            alt="Snapshot bukti"
                            className={`w-full max-w-sm rounded-lg border object-cover ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </>
  )
}
