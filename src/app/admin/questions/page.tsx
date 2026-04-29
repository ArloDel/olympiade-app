"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Settings, LogOut, Plus, Trash2, CheckCircle, ShieldCheck } from "lucide-react"

export default function QuestionsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [exams, setExams] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [questions, setQuestions] = useState<any[]>([])

  // Form states
  const [loading, setLoading] = useState(false)
  const [questionText, setQuestionText] = useState("")
  const [options, setOptions] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ])

  useEffect(() => {
    if (status === "unauthenticated") {
      // router.replace("/login")
    } else {
      fetchExams()
    }
  }, [status, router])

  useEffect(() => {
    if (selectedExamId) {
      fetchQuestions(selectedExamId)
    } else {
      setQuestions([])
    }
  }, [selectedExamId])

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams")
      const data = await res.json()
      if (data.success) {
        setExams(data.data)
        if (data.data.length > 0) {
          setSelectedExamId(data.data[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchQuestions = async (examId: string) => {
    try {
      const res = await fetch(`/api/questions?examId=${examId}`)
      const data = await res.json()
      if (data.success) {
        setQuestions(data.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateExam = async () => {
    const title = prompt("Nama Ujian:")
    if (!title) return
    const duration = prompt("Durasi (menit):", "120") || "120"
    
    // Default to a 24-hour window from now
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000)

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: "Created from admin panel",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration,
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchExams()
      } else {
        alert("Gagal membuat ujian")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options]
    newOptions[index].text = text
    setOptions(newOptions)
  }

  const handleSetCorrect = (index: number) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }))
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, { text: "", isCorrect: false }])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) return alert("Minimal 2 opsi jawaban")
    const newOptions = options.filter((_, i) => i !== index)
    if (options[index].isCorrect && newOptions.length > 0) {
      newOptions[0].isCorrect = true
    }
    setOptions(newOptions)
  }

  const handleSaveQuestion = async () => {
    if (!selectedExamId) return alert("Pilih ujian terlebih dahulu")
    if (!questionText.trim()) return alert("Teks soal tidak boleh kosong")
    if (options.some(o => !o.text.trim())) return alert("Semua opsi jawaban harus diisi")
    
    setLoading(true)
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          text: questionText,
          order: questions.length + 1,
          options,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setQuestionText("")
        setOptions([
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ])
        fetchQuestions(selectedExamId)
      } else {
        alert("Gagal menyimpan soal: " + data.error)
      }
    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

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
              <Link href="/admin" className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all">Monitoring</Link>
              <Link href="/admin/questions" className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium border border-white/10 shadow-sm transition-all">Soal</Link>
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

      {/* Main Content */}
      <main className="flex-1 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[500px] opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent blur-3xl -z-10"></div>
        
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Manajemen Soal</h1>
              <p className="text-zinc-400">Pusat pengaturan bank soal dan opsi jawaban.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                      Buat Soal Baru
                    </h2>
                    
                    <div className="flex items-center gap-3">
                      <select 
                        className="bg-zinc-900/50 border border-white/10 rounded-xl text-sm px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-white w-48 shadow-inner transition-all hover:bg-zinc-900/80"
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                      >
                        <option value="" disabled className="bg-zinc-900 text-zinc-400">-- Pilih Ujian --</option>
                        {exams.map(ex => (
                          <option key={ex.id} value={ex.id} className="bg-zinc-900">{ex.title}</option>
                        ))}
                      </select>
                      <button onClick={handleCreateExam} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2">
                        <Plus size={16} /> Ujian Baru
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Pertanyaan Utama
                      </label>
                      <textarea 
                        rows={4}
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Tulis pertanyaan di sini..."
                        className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y text-white placeholder-zinc-500 shadow-inner transition-all hover:bg-zinc-900/80"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-3">
                        Opsi Jawaban
                      </label>
                      <div className="space-y-3">
                        {options.map((opt, idx) => (
                          <div key={idx} className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${opt.isCorrect ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-white/20'}`}>
                            <button 
                              onClick={() => handleSetCorrect(idx)}
                              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${opt.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-zinc-600 text-transparent hover:border-emerald-500/50'}`}
                            >
                              <CheckCircle size={14} />
                            </button>
                            <input 
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionChange(idx, e.target.value)}
                              placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                              className="flex-1 bg-transparent text-sm outline-none text-white placeholder-zinc-600"
                            />
                            <button onClick={() => removeOption(idx)} className="text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <button onClick={addOption} className="mt-4 text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors">
                        <div className="p-1 rounded-md bg-indigo-500/20"><Plus size={14} /></div> Tambah Opsi
                      </button>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <button 
                        onClick={handleSaveQuestion}
                        disabled={loading || !selectedExamId}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/40"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Menyimpan...
                          </span>
                        ) : 'Simpan ke Bank Soal'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Question List */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl flex flex-col h-[calc(100vh-10rem)] overflow-hidden">
                <div className="p-5 border-b border-white/10 bg-white/[0.02]">
                  <h3 className="font-bold text-white text-lg">Daftar Soal Tersimpan</h3>
                  <p className="text-xs text-indigo-400 mt-1 font-medium">
                    {questions.length} soal aktif
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {questions.length === 0 ? (
                    <div className="text-center text-zinc-500 text-sm py-16 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <CheckCircle className="opacity-50" size={20} />
                      </div>
                      <p>Pilih ujian untuk melihat soal</p>
                    </div>
                  ) : (
                    questions.map((q, idx) => (
                      <div key={q.id} className="p-4 bg-zinc-900/50 hover:bg-zinc-900/80 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">Soal {idx + 1}</div>
                        </div>
                        <div className="text-sm text-zinc-200 font-medium mb-3 line-clamp-2 leading-relaxed">{q.text}</div>
                        <div className="space-y-1.5">
                          {q.options.map((opt: any) => (
                            <div key={opt.id} className={`text-[11px] px-2.5 py-1.5 rounded-lg border ${opt.isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-transparent text-zinc-400'}`}>
                              <span className="opacity-50 mr-1">•</span> {opt.text} {opt.isCorrect && <span className="float-right">✓</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}} />
    </div>
  )
}
