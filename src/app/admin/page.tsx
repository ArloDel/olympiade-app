"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Users, AlertTriangle, CheckCircle, Video, LogOut, Search, Activity, ShieldCheck, ShieldAlert, Lock, Moon, Sun } from "lucide-react"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"dark" | "light">("dark")

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
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-zinc-300 selection:bg-white/20' : 'bg-white text-zinc-600 selection:bg-black/10'}`}>
      
      {/* Ultra Minimal Header */}
      <header className={`sticky top-0 z-30 border-b ${isDark ? 'border-zinc-900 bg-[#0a0a0a]/80' : 'border-zinc-100 bg-white/80'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className={`font-semibold text-sm tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                <ShieldCheck size={14} />
              </div>
              OlymAdmin
            </div>
            <nav className="hidden md:flex gap-6 text-sm">
              <Link href="/admin" className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Monitoring</Link>
              <Link href="/admin/exams" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Ujian</Link>
              <Link href="/admin/questions" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Soal</Link>
              <Link href="/admin/results" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Rekap Nilai</Link>
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

      {/* Main Content - No Cards, Flat Minimalist Layout */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        
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

        {/* Minimal Stats Inline */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 py-8 mb-12 border-y ${isDark ? 'border-zinc-900' : 'border-zinc-100'}`}>
          <div className="flex flex-col">
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'} mb-2 flex items-center gap-2`}><Users size={14}/> Total</span>
            <span className={`text-3xl font-medium ${isDark ? 'text-white' : 'text-black'}`}>{loading ? "-" : totalUsers}</span>
          </div>
          <div className="flex flex-col">
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'} mb-2 flex items-center gap-2`}><Activity size={14}/> Aman</span>
            <span className={`text-3xl font-medium ${isDark ? 'text-white' : 'text-black'}`}>{loading ? "-" : safeUsers}</span>
          </div>
          <div className="flex flex-col">
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'} mb-2 flex items-center gap-2`}><ShieldAlert size={14}/> Peringatan</span>
            <span className={`text-3xl font-medium ${isDark ? 'text-white' : 'text-black'}`}>{loading ? "-" : warningUsers}</span>
          </div>
          <div className="flex flex-col">
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'} mb-2 flex items-center gap-2`}><Lock size={14}/> Terkunci</span>
            <span className={`text-3xl font-medium ${isDark ? 'text-white' : 'text-black'}`}>{loading ? "-" : lockedUsers}</span>
          </div>
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

                <div className="hidden md:flex md:col-span-3 justify-end">
                  <button 
                    onClick={() => toggleLock(p.id, p.isLocked)}
                    className={`text-xs font-medium px-4 py-2 rounded transition-colors ${
                      p.isLocked 
                        ? isDark ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-zinc-200 text-black hover:bg-zinc-300"
                        : isDark ? "border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600" : "border border-zinc-200 text-zinc-500 hover:text-black hover:border-zinc-400"
                    }`}
                  >
                    {p.isLocked ? "Buka Akses" : "Kunci"}
                  </button>
                </div>
              </div>
            )})}
            
            {filteredParticipants.length === 0 && (
              <div className={`py-12 text-center text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Tidak ada peserta yang ditemukan.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
