"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Users, AlertTriangle, CheckCircle, Video, Settings, LogOut, Search } from "lucide-react"

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
    if (s === 'safe') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
    if (s === 'warning') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
    if (s === 'danger') return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
    return 'bg-slate-100 text-slate-700'
  }

  const getStatusIcon = (s: string) => {
    if (s === 'safe') return <CheckCircle size={16} />
    if (s === 'warning') return <AlertTriangle size={16} />
    if (s === 'danger') return <Video size={16} className="opacity-50" />
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="font-bold text-xl tracking-tight flex items-center gap-2">
              <span className="text-blue-500">Olym</span>Admin
            </div>
            <nav className="hidden md:flex gap-4">
              <Link href="/admin" className="px-3 py-2 bg-slate-800 rounded-md text-sm font-medium">Monitoring Ujian</Link>
              <Link href="/admin/questions" className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-sm font-medium transition-colors">Manajemen Soal</Link>
              <Link href="#" className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-sm font-medium transition-colors">Peserta</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Settings size={20} />
            </button>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Live Monitoring: Olimpiade Matematika</h1>
              <p className="text-slate-500 mt-1">Total 600 Peserta | 580 Online | 20 Peringatan</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari peserta..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Filter
              </button>
            </div>
          </div>

          {/* Grid Participants */}
          {loading ? (
            <div className="text-center py-10 text-slate-500 font-medium">Memuat data peserta...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredParticipants.map(p => {
                const pStatus = getParticipantStatus(p)
                return (
                <div key={p.id} className={`bg-white dark:bg-slate-800 rounded-xl p-4 border ${pStatus === 'danger' ? 'border-red-300 dark:border-red-800 shadow-sm shadow-red-100' : 'border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="overflow-hidden pr-2">
                      <div className="font-bold text-slate-900 dark:text-white truncate" title={p.name}>{p.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5 truncate" title={p.email}>{p.email}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border shrink-0 ${getStatusColor(pStatus)}`}>
                      {getStatusIcon(pStatus)}
                      {p.isLocked ? 'LOCKED' : pStatus.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden border border-slate-200 dark:border-slate-800">
                    {p.isLocked ? (
                      <div className="text-center p-4">
                        <Video size={24} className="mx-auto text-red-500 mb-2 opacity-50" />
                        <div className="text-xs text-red-500 font-medium">Akses Terkunci</div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                        [Snapshot Image]
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <div className="text-slate-500">Updated: Baru Saja</div>
                    {p.warnings > 0 && (
                      <div className="text-yellow-600 dark:text-yellow-500 font-medium bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded">
                        {p.warnings} Pelanggaran
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => toggleLock(p.id, p.isLocked)}
                    className={`w-full mt-3 py-1.5 text-xs font-bold rounded transition-colors border ${
                      p.isLocked 
                        ? "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50" 
                        : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {p.isLocked ? "Buka Kunci Akses (Unlock)" : "Kunci Akses (Lock)"}
                  </button>
                </div>
              )})}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
