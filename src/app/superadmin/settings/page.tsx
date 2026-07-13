"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ShieldAlert, Moon, Sun, LogOut, Wrench, StopCircle, Download, AlertTriangle } from "lucide-react"
import { useTheme } from "@/hooks/useTheme";

export default function SuperadminSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [theme, setTheme] = useTheme()
  
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated" && (session?.user as any)?.role !== "SUPERADMIN") {
      router.replace("/dashboard")
    } else if (status === "authenticated") {
      fetchMaintenanceStatus()
    }
  }, [status, router, session])

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch("/api/superadmin/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GET_MAINTENANCE" })
      })
      const data = await res.json()
      if (data.success) {
        setMaintenanceMode(data.data.maintenanceMode)
      }
    } catch (err) {
      console.error("Failed to fetch maintenance status", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleMaintenance = async () => {
    const actionName = maintenanceMode ? "Mematikan" : "Menyalakan"
    if (!confirm(`Apakah Anda yakin ingin ${actionName} Maintenance Mode?`)) return;
    
    setActionLoading(true)
    try {
      const res = await fetch("/api/superadmin/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_MAINTENANCE" })
      })
      const data = await res.json()
      if (data.success) {
        setMaintenanceMode(data.data.maintenanceMode === "true")
        alert(`Maintenance Mode berhasil di${maintenanceMode ? 'matikan' : 'aktifkan'}`)
      } else {
        alert("Gagal mengubah status maintenance: " + data.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan")
    } finally {
      setActionLoading(false)
    }
  }

  const stopAllExams = async () => {
    if (!confirm("PERINGATAN KRITIS: Anda akan MENGHENTIKAN SEMUA UJIAN yang sedang berlangsung. Tindakan ini tidak bisa dibatalkan. Apakah Anda sangat yakin?")) return;
    
    setActionLoading(true)
    try {
      const res = await fetch("/api/superadmin/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "STOP_ALL_EXAMS" })
      })
      const data = await res.json()
      if (data.success) {
        alert(`Berhasil menghentikan ${data.data.stoppedCount} ujian yang sedang aktif.`)
      } else {
        alert("Gagal menghentikan ujian: " + data.error)
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan")
    } finally {
      setActionLoading(false)
    }
  }

  const handleExport = () => {
    window.location.href = "/api/superadmin/export"
  }

  const isDark = theme === "dark"

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
              <Link href="/superadmin" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Dashboard</Link>
              <Link href="/superadmin/admins" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Kelola Admin</Link>
              <Link href="/superadmin/logs" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Log Aktivitas</Link>
              <Link href="/superadmin/settings" className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Pengaturan Global</Link>
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

      <main className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
        
        <div className="mb-10">
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-amber-500' : 'bg-amber-600'} animate-pulse`}></span>
            Kontrol Darurat
          </div>
          <h1 className={`text-3xl font-medium tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Pengaturan Global</h1>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Kontrol sistem skala besar untuk menangani situasi krisis.</p>
        </div>

        <div className="space-y-6">
          
          {/* Maintenance Mode */}
          <div className={`p-6 md:p-8 rounded-2xl border flex flex-col md:flex-row gap-6 md:items-center justify-between ${isDark ? 'glass-panel glow-border' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div>
              <div className={`flex items-center gap-3 mb-2 font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                  <Wrench size={20} />
                </div>
                Maintenance Mode
              </div>
              <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'} md:max-w-md`}>
                Mengunci semua siswa agar tidak bisa login ke dalam aplikasi. Berlaku seketika untuk semua perangkat.
              </p>
            </div>
            <button 
              onClick={toggleMaintenance}
              disabled={actionLoading}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center min-w-[140px] ${
                maintenanceMode 
                  ? (isDark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300')
                  : (isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800')
              }`}
            >
              {maintenanceMode ? "Matikan Maintenance" : "Aktifkan Maintenance"}
            </button>
          </div>

          {/* Stop All Exams */}
          <div className={`p-6 md:p-8 rounded-2xl border flex flex-col md:flex-row gap-6 md:items-center justify-between ${isDark ? 'border-red-900/30 bg-red-950/10' : 'border-red-100 bg-red-50/50 shadow-sm'}`}>
            <div>
              <div className={`flex items-center gap-3 mb-2 font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/10' : 'bg-red-100'}`}>
                  <StopCircle size={20} />
                </div>
                Stop All Exams (Panic Button)
              </div>
              <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-600'} md:max-w-md`}>
                <span className="font-semibold">BAHAYA:</span> Tindakan ini akan mengakhiri/menutup secara paksa semua sesi ujian yang sedang berjalan di seluruh platform. 
              </p>
            </div>
            <button 
              onClick={stopAllExams}
              disabled={actionLoading}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 min-w-[140px] ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'bg-red-600 text-white hover:bg-red-700'}`}
            >
              <AlertTriangle size={16} /> Hentikan Ujian
            </button>
          </div>

          {/* Export Data */}
          <div className={`p-6 md:p-8 rounded-2xl border flex flex-col md:flex-row gap-6 md:items-center justify-between ${isDark ? 'glass-panel glow-border' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div>
              <div className={`flex items-center gap-3 mb-2 font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                  <Download size={20} />
                </div>
                Global Data Export
              </div>
              <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'} md:max-w-md`}>
                Unduh seluruh data nilai, jawaban, dan informasi ujian ke dalam format CSV untuk keperluan pelaporan atau analisis eksternal.
              </p>
            </div>
            <button 
              onClick={handleExport}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 min-w-[140px] ${isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200'}`}
            >
              <Download size={16} /> Export CSV
            </button>
          </div>

        </div>

      </main>
    </div>
  )
}
