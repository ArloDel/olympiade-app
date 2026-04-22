"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Users, AlertTriangle, CheckCircle, Video, Settings, LogOut, Search } from "lucide-react"

// Mock Participants
const MOCK_PARTICIPANTS = [
  { id: "p1", name: "Budi Santoso", nim: "2301001", status: "safe", warnings: 0, lastSnapshot: "2 menit lalu" },
  { id: "p2", name: "Siti Aminah", nim: "2301002", status: "warning", warnings: 1, lastSnapshot: "1 menit lalu" },
  { id: "p3", name: "Agus Pratama", nim: "2301003", status: "danger", warnings: 3, lastSnapshot: "5 menit lalu (Offline)" },
  { id: "p4", name: "Dewi Lestari", nim: "2301004", status: "safe", warnings: 0, lastSnapshot: "Baru saja" },
  { id: "p5", name: "Rizky Firmansyah", nim: "2301005", status: "safe", warnings: 0, lastSnapshot: "Baru saja" },
  { id: "p6", name: "Anisa Fitri", nim: "2301006", status: "warning", warnings: 2, lastSnapshot: "10 detik lalu" },
]

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // In real app, we check if session.user.role === 'ADMIN'
    if (status === "unauthenticated") {
      // router.replace("/login")
    }
  }, [status, router])

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

  const filteredParticipants = MOCK_PARTICIPANTS.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.nim.includes(searchTerm)
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
              <button className="px-3 py-2 bg-slate-800 rounded-md text-sm font-medium">Monitoring Ujian</button>
              <button className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-sm font-medium transition-colors">Manajemen Soal</button>
              <button className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-sm font-medium transition-colors">Peserta</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Settings size={20} />
            </button>
            <button onClick={() => signOut()} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredParticipants.map(p => (
              <div key={p.id} className={`bg-white dark:bg-slate-800 rounded-xl p-4 border ${p.status === 'danger' ? 'border-red-300 dark:border-red-800 shadow-sm shadow-red-100' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{p.nim}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border ${getStatusColor(p.status)}`}>
                    {getStatusIcon(p.status)}
                    {p.status.toUpperCase()}
                  </div>
                </div>
                
                <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden border border-slate-200 dark:border-slate-800">
                  {p.status === 'danger' ? (
                    <div className="text-center p-4">
                      <Video size={24} className="mx-auto text-red-500 mb-2 opacity-50" />
                      <div className="text-xs text-red-500 font-medium">Kamera Mati / Offline</div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                      [Snapshot Image]
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <div className="text-slate-500">Updated: {p.lastSnapshot}</div>
                  {p.warnings > 0 && (
                    <div className="text-yellow-600 dark:text-yellow-500 font-medium bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded">
                      {p.warnings} Pelanggaran
                    </div>
                  )}
                </div>
                
                {p.status === 'danger' && (
                  <button className="w-full mt-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded transition-colors border border-red-200 dark:border-red-800/50">
                    Buka Kunci Akses (Unlock)
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
