"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ShieldCheck, Moon, Sun, LogOut, Plus, Edit, Trash2, Calendar, Clock, BookOpen, ShieldAlert, GripVertical } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

export default function ExamsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [exams, setExams] = useState<any[]>([])
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    duration: 120,
    randomizeQuestions: false,
    randomizeOptions: false,
    requireSeb: false,
    sebExamKey: "",
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
        randomizeQuestions: exam.randomizeQuestions || false,
        randomizeOptions: exam.randomizeOptions || false,
        requireSeb: exam.requireSeb || false,
        sebExamKey: exam.sebExamKey || "",
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
        randomizeQuestions: false,
        randomizeOptions: false,
        requireSeb: false,
        sebExamKey: "",
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

  const handleActivate = async (id: string) => {
    if (!confirm("Aktifkan ujian ini? Ujian lain akan otomatis dinonaktifkan untuk siswa.")) return;
    try {
      const res = await fetch(`/api/exams/${id}/activate`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) {
        fetchExams();
      } else {
        alert("Gagal mengaktifkan ujian: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const res = await fetch(`/api/exams/${id}/deactivate`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) {
        fetchExams();
      } else {
        alert("Gagal menonaktifkan ujian: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    }
  };

  const onDragEnd = (result: any) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    if (destination.droppableId === "ACTIVE") {
      const ex = exams.find(e => e.id === draggableId);
      if (ex && !ex.isActive) {
        handleActivate(draggableId);
      }
    } else if (destination.droppableId === "DRAFT") {
      const ex = exams.find(e => e.id === draggableId);
      if (ex && ex.isActive) {
        handleDeactivate(draggableId);
      }
    } else if (destination.droppableId === "FINISHED") {
      alert("Tidak bisa memindahkan manual ke status Selesai. Status ini otomatis berubah ketika waktu habis.");
    }
  };

  const isDark = theme === "dark"
  const now = new Date()

  // Categorize exams
  const draftExams = exams.filter(ex => !ex.isActive && new Date(ex.endTime) > now)
  const activeExams = exams.filter(ex => ex.isActive)
  const finishedExams = exams.filter(ex => !ex.isActive && new Date(ex.endTime) <= now)

  const renderExamCard = (exam: any, provided: any, snapshot: any) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={`p-5 mb-4 border rounded-xl shadow-sm flex flex-col gap-3 group
        ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}
        ${snapshot.isDragging ? (isDark ? 'shadow-white/10 rotate-2' : 'shadow-black/10 rotate-2') : ''}
        transition-all`}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div 
            {...provided.dragHandleProps}
            className={`mt-1 cursor-grab active:cursor-grabbing ${isDark ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            <GripVertical size={16} />
          </div>
          <div>
            <h3 className={`font-semibold line-clamp-1 ${isDark ? 'text-white' : 'text-black'}`}>{exam.title}</h3>
            <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{exam.description || "Tidak ada deskripsi"}</p>
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleOpenModal(exam)} className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>
            <Edit size={14} />
          </button>
          <button onClick={() => handleDelete(exam.id)} className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-rose-500' : 'text-zinc-400 hover:text-rose-600'}`}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
        <div className="flex items-center gap-1.5">
          <BookOpen size={12} /> {exam._count?.examQuestions || 0} Soal
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} /> {exam.duration} Min
        </div>
        <div className="flex items-center gap-1.5 w-full">
          <Calendar size={12} /> 
          {new Date(exam.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} 
          - {new Date(exam.endTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </div>
      </div>
    </div>
  )

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
              <Link href="/admin/grading" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Koreksi</Link>
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
            <h1 className={`text-3xl font-medium tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Manajemen Ujian</h1>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Tarik (drag) kartu ke kolom yang sesuai untuk mengubah status ujian.</p>
          </div>
          
          <button onClick={() => handleOpenModal()} className={`px-5 py-3 text-sm font-medium transition-colors rounded-lg shadow-sm flex items-center gap-2 ${isDark ? 'bg-white hover:bg-zinc-200 text-black' : 'bg-black hover:bg-zinc-800 text-white'}`}>
            <Plus size={16} /> Buat Ujian Baru
          </button>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
          </div>
        ) : isMounted ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Kolom DRAFT */}
              <div className={`flex flex-col rounded-2xl border p-4 ${isDark ? 'bg-[#111] border-zinc-800/50' : 'bg-zinc-50 border-zinc-200/50'}`}>
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                    Belum Aktif <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'}`}>{draftExams.length}</span>
                  </h2>
                </div>
                <Droppable droppableId="DRAFT">
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[300px] rounded-xl transition-colors ${snapshot.isDraggingOver ? (isDark ? 'bg-zinc-800/30' : 'bg-zinc-200/50') : ''}`}
                    >
                      {draftExams.map((exam, index) => (
                        <Draggable key={exam.id} draggableId={exam.id} index={index}>
                          {(provided, snapshot) => renderExamCard(exam, provided, snapshot)}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Kolom ACTIVE */}
              <div className={`flex flex-col rounded-2xl border p-4 ${isDark ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className={`font-semibold text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    Sedang Berjalan <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-200/50 text-emerald-700'}`}>{activeExams.length}</span>
                  </h2>
                </div>
                <Droppable droppableId="ACTIVE">
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[300px] rounded-xl transition-colors ${snapshot.isDraggingOver ? (isDark ? 'bg-emerald-900/20' : 'bg-emerald-200/40') : ''}`}
                    >
                      {activeExams.map((exam, index) => (
                        <Draggable key={exam.id} draggableId={exam.id} index={index}>
                          {(provided, snapshot) => renderExamCard(exam, provided, snapshot)}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {activeExams.length === 0 && !snapshot.isDraggingOver && (
                         <div className={`h-32 border-2 border-dashed rounded-xl flex items-center justify-center text-xs font-medium ${isDark ? 'border-emerald-900/30 text-emerald-500/50' : 'border-emerald-200 text-emerald-600/50'}`}>
                           Tarik ke sini untuk mengaktifkan ujian
                         </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Kolom FINISHED */}
              <div className={`flex flex-col rounded-2xl border p-4 opacity-75 ${isDark ? 'bg-[#111] border-zinc-800/50' : 'bg-zinc-50 border-zinc-200/50'}`}>
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className={`font-semibold text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Selesai <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-200 text-zinc-400'}`}>{finishedExams.length}</span>
                  </h2>
                </div>
                <Droppable droppableId="FINISHED" isDropDisabled={true}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className="flex-1 min-h-[300px] rounded-xl"
                    >
                      {finishedExams.map((exam, index) => (
                        <Draggable key={exam.id} draggableId={exam.id} index={index} isDragDisabled={true}>
                          {(provided, snapshot) => renderExamCard(exam, provided, snapshot)}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

            </div>
          </DragDropContext>
        ) : null}

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

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="randomizeQuestions"
                    checked={formData.randomizeQuestions}
                    onChange={e => setFormData({...formData, randomizeQuestions: e.target.checked})}
                    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black accent-black"
                  />
                  <label htmlFor="randomizeQuestions" className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Acak Urutan Soal</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="randomizeOptions"
                    checked={formData.randomizeOptions}
                    onChange={e => setFormData({...formData, randomizeOptions: e.target.checked})}
                    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black accent-black"
                  />
                  <label htmlFor="randomizeOptions" className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Acak Urutan Opsi</label>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="requireSeb"
                    checked={formData.requireSeb}
                    onChange={e => setFormData({...formData, requireSeb: e.target.checked})}
                    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black accent-black"
                  />
                  <label htmlFor="requireSeb" className={`text-xs font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    Wajib menggunakan Safe Exam Browser
                  </label>
                </div>
                
                {formData.requireSeb && (
                  <div className="space-y-1 pl-6">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      Browser Exam Key (Opsional)
                    </label>
                    <input 
                      type="text" 
                      value={formData.sebExamKey}
                      onChange={e => setFormData({...formData, sebExamKey: e.target.value})}
                      className={`w-full px-0 py-2.5 text-sm outline-none transition-colors border-b bg-transparent ${isDark ? 'border-zinc-800 text-white placeholder-zinc-700 focus:border-white' : 'border-zinc-200 text-black placeholder-zinc-400 focus:border-black'}`}
                      placeholder="Kosongkan untuk mode dasar (Hanya User-Agent)"
                    />
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      Isi dengan Kunci Ujian (BEK) dari aplikasi SEB Config Tool untuk keamanan ketat.
                    </p>
                  </div>
                )}
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

      {/* Floating Superadmin Button */}
      {(session?.user as any)?.role === "SUPERADMIN" && (
        <Link href="/superadmin" className={`fixed bottom-6 right-6 px-4 py-3 rounded-full shadow-lg shadow-amber-500/20 font-medium flex items-center gap-2 transition-transform hover:scale-105 z-50 ${isDark ? 'bg-amber-500 text-black' : 'bg-amber-600 text-white'}`}>
          <ShieldAlert size={18} />
          Superadmin Panel
        </Link>
      )}
    </div>
  )
}
