"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ShieldCheck, Moon, Sun, LogOut, Plus, Edit, Trash2, Calendar, Clock, BookOpen } from "lucide-react"

export default function ExamsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [exams, setExams] = useState<any[]>([])
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [loading, setLoading] = useState(true)

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    duration: 120,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchExams()
    }
  }, [status, router])

  const fetchExams = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/exams")
      const data = await res.json()
      if (data.success) {
        setExams(data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (exam?: any) => {
    if (exam) {
      setEditingId(exam.id)
      setFormData({
        title: exam.title,
        description: exam.description || "",
        startTime: new Date(exam.startTime).toISOString().slice(0, 16),
        endTime: new Date(exam.endTime).toISOString().slice(0, 16),
        duration: exam.duration,
      })
    } else {
      setEditingId(null)
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      setFormData({
        title: "",
        description: "",
        startTime: now.toISOString().slice(0, 16),
        endTime: tomorrow.toISOString().slice(0, 16),
        duration: 120,
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/exams/${editingId}` : "/api/exams"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
        }),
      })

      const data = await res.json()
      if (data.success) {
        setIsModalOpen(false)
        fetchExams()
      } else {
        alert("Gagal menyimpan ujian: " + data.error)
      }
    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan sistem")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ujian ini? Semua soal dan jawaban yang terkait akan ikut terhapus.")) return

    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        fetchExams()
      } else {
        alert("Gagal menghapus ujian")
      }
    } catch (err) {
      console.error(err)
    }
  }

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
              <Link href="/admin" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Monitoring</Link>
              <Link href="/admin/exams" className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Ujian</Link>
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

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full relative">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className={`text-3xl font-medium tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Konfigurasi Ujian</h1>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Kelola jadwal, durasi, dan informasi ujian Anda.</p>
          </div>
          
          <button onClick={() => handleOpenModal()} className={`px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap rounded flex items-center gap-2 ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-black'}`}>
            <Plus size={14} /> Buat Ujian Baru
          </button>
        </div>

        {/* Exams List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
          </div>
        ) : exams.length === 0 ? (
          <div className={`py-20 text-center text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Belum ada ujian yang dibuat.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => (
              <div key={exam.id} className={`p-6 border rounded-lg transition-all ${isDark ? 'bg-[#0a0a0a] border-zinc-900 hover:border-zinc-800' : 'bg-white border-zinc-100 hover:border-zinc-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className={`text-lg font-medium truncate pr-4 ${isDark ? 'text-white' : 'text-black'}`}>{exam.title}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(exam)} className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(exam.id)} className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-rose-500' : 'text-zinc-400 hover:text-rose-600'}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p className={`text-sm mb-6 line-clamp-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  {exam.description || "Tidak ada deskripsi"}
                </p>

                <div className={`space-y-3 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className={isDark ? "text-zinc-600" : "text-zinc-400"} />
                    {new Date(exam.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className={isDark ? "text-zinc-600" : "text-zinc-400"} />
                    {exam.duration} Menit
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className={isDark ? "text-zinc-600" : "text-zinc-400"} />
                    {exam._count?.questions || 0} Soal
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Modal / Slide Over for Editing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={`relative w-full max-w-lg p-8 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-[#0a0a0a] border border-zinc-800' : 'bg-white border border-zinc-100'}`}>
            <h2 className={`text-xl font-medium mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
              {editingId ? "Edit Konfigurasi Ujian" : "Buat Ujian Baru"}
            </h2>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Nama Ujian</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className={`w-full px-0 py-2.5 text-sm outline-none transition-colors border-b bg-transparent ${isDark ? 'border-zinc-800 text-white placeholder-zinc-700 focus:border-white' : 'border-zinc-200 text-black placeholder-zinc-400 focus:border-black'}`}
                  placeholder="Misal: Olimpiade Matematika 2026"
                />
              </div>

              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Deskripsi</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className={`w-full px-0 py-2.5 text-sm outline-none transition-colors border-b bg-transparent resize-y ${isDark ? 'border-zinc-800 text-white placeholder-zinc-700 focus:border-white' : 'border-zinc-200 text-black placeholder-zinc-400 focus:border-black'}`}
                  placeholder="Deskripsi singkat mengenai ujian ini"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Waktu Mulai</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className={`w-full px-0 py-2.5 text-sm outline-none transition-colors border-b bg-transparent ${isDark ? 'border-zinc-800 text-white focus:border-white' : 'border-zinc-200 text-black focus:border-black'} [color-scheme:dark]`}
                    style={{ colorScheme: isDark ? 'dark' : 'light' }}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Waktu Selesai</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className={`w-full px-0 py-2.5 text-sm outline-none transition-colors border-b bg-transparent ${isDark ? 'border-zinc-800 text-white focus:border-white' : 'border-zinc-200 text-black focus:border-black'} [color-scheme:dark]`}
                    style={{ colorScheme: isDark ? 'dark' : 'light' }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Durasi (Menit)</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                  className={`w-full px-0 py-2.5 text-sm outline-none transition-colors border-b bg-transparent ${isDark ? 'border-zinc-800 text-white focus:border-white' : 'border-zinc-200 text-black focus:border-black'}`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className={`px-6 py-2.5 text-xs font-medium rounded transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className={`px-6 py-2.5 text-xs font-medium rounded transition-colors ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
