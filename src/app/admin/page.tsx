"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Users, AlertTriangle, CheckCircle, Video, Settings, LogOut, Search, Activity, ShieldCheck, ShieldAlert, Lock } from "lucide-react"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const getStatusColor = (s: string) => {
    if (s === 'safe') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (s === 'warning') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    if (s === 'danger') return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
  }

  const getStatusIcon = (s: string) => {
    if (s === 'safe') return <CheckCircle size={14} className="mr-1.5" />
    if (s === 'warning') return <AlertTriangle size={14} className="mr-1.5" />
    if (s === 'danger') return <Lock size={14} className="mr-1.5" />
    return null
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

  // Stats calculation
  const totalUsers = participants.length;
  const safeUsers = participants.filter(p => getParticipantStatus(p) === 'safe').length;
  const warningUsers = participants.filter(p => getParticipantStatus(p) === 'warning').length;
  const lockedUsers = participants.filter(p => getParticipantStatus(p) === 'danger').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
        <div className="px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <div className="font-bold text-xl tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck size={18} className="text-white" />
              </div>
              <span><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Olym</span>Admin</span>
            </div>
            <nav className="hidden md:flex gap-1">
              <Link href="/admin" className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium border border-white/10 shadow-sm transition-all">Monitoring</Link>
              <Link href="/admin/questions" className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all">Soal</Link>
              <Link href="/admin/results" className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all">Rekap Nilai</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <Settings size={18} />
            </button>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-2.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with subtle radial gradient background */}
      <main className="flex-1 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-zinc-950 to-zinc-950 blur-3xl -z-10"></div>
        
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Area */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                <span className="text-xs font-bold tracking-wider uppercase">Live System</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Monitoring Peserta</h1>
              <p className="text-zinc-400">Pantau aktivitas ujian matematika secara real-time.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari peserta..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-white placeholder-zinc-500 transition-all backdrop-blur-md"
                />
              </div>
            </div>
          </div>

          {/* Overview Stats Bento Box */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors duration-300">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Users size={24} /></div>
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-1">Total Peserta</p>
                <h3 className="text-2xl font-bold text-white">{loading ? "-" : totalUsers}</h3>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors duration-300">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Activity size={24} /></div>
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-1">Status Aman</p>
                <h3 className="text-2xl font-bold text-white">{loading ? "-" : safeUsers}</h3>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors duration-300">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><ShieldAlert size={24} /></div>
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-1">Peringatan Aktif</p>
                <h3 className="text-2xl font-bold text-white">{loading ? "-" : warningUsers}</h3>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition-colors duration-300">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl"><Lock size={24} /></div>
              <div>
                <p className="text-xs text-zinc-400 font-medium mb-1">Akses Terkunci</p>
                <h3 className="text-2xl font-bold text-white">{loading ? "-" : lockedUsers}</h3>
              </div>
            </div>
          </div>

          {/* Grid Participants */}
          {loading ? (
            <div className="text-center py-20 text-zinc-500 flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Memuat koneksi real-time...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredParticipants.map(p => {
                const pStatus = getParticipantStatus(p)
                return (
                <div key={p.id} className={`group relative bg-white/5 backdrop-blur-md border rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 overflow-hidden
                  ${pStatus === 'danger' ? 'border-rose-500/30 hover:border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 
                    pStatus === 'warning' ? 'border-amber-500/20 hover:border-amber-500/40' : 
                    'border-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/5 hover:bg-white/[0.07]'}
                `}>
                  
                  {/* Subtle gradient background effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="overflow-hidden pr-3">
                        <div className="font-bold text-white truncate text-base" title={p.name}>{p.name}</div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5 truncate" title={p.email}>{p.email}</div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider flex items-center border shrink-0 uppercase shadow-sm ${getStatusColor(pStatus)}`}>
                        {getStatusIcon(pStatus)}
                        {p.isLocked ? 'LOCKED' : pStatus}
                      </div>
                    </div>
                    
                    <div className="aspect-video bg-black/40 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors">
                      {p.isLocked ? (
                        <div className="text-center p-4">
                          <Video size={28} className="mx-auto text-rose-500/50 mb-2" />
                          <div className="text-xs text-rose-500/70 font-medium tracking-wide">KONEKSI DIPUTUS</div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-mono text-xs">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <span className="relative z-10 flex items-center gap-2">
                            <Video size={14}/> FEED AKTIF
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs mb-4">
                      <div className="text-zinc-500 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Live
                      </div>
                      {p.warnings > 0 && (
                        <div className="text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          {p.warnings} Pelanggaran
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => toggleLock(p.id, p.isLocked)}
                      className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all duration-300 border ${
                        p.isLocked 
                          ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20 hover:border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]" 
                          : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10 hover:border-white/20"
                      }`}
                    >
                      {p.isLocked ? "Buka Akses Peserta" : "Kunci Akses"}
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
