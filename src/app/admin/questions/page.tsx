"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Settings, LogOut, Plus, Trash2, CheckCircle } from "lucide-react"

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
    // If the removed option was correct, make the first one correct
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="font-bold text-xl tracking-tight flex items-center gap-2">
              <span className="text-blue-500">Olym</span>Admin
            </div>
            <nav className="hidden md:flex gap-4">
              <Link href="/admin" className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-sm font-medium transition-colors">Monitoring Ujian</Link>
              <Link href="/admin/questions" className="px-3 py-2 bg-slate-800 rounded-md text-sm font-medium">Manajemen Soal</Link>
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

      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Buat Soal Baru</h2>
                
                <div className="flex items-center gap-3">
                  <select 
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                  >
                    <option value="" disabled>-- Pilih Ujian --</option>
                    {exams.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.title}</option>
                    ))}
                  </select>
                  <button onClick={handleCreateExam} className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium flex items-center gap-1">
                    <Plus size={16} /> Ujian Baru
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Pertanyaan
                  </label>
                  <textarea 
                    rows={4}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Tulis pertanyaan di sini..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Opsi Jawaban
                  </label>
                  <div className="space-y-3">
                    {options.map((opt, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border ${opt.isCorrect ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'}`}>
                        <button 
                          onClick={() => handleSetCorrect(idx)}
                          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${opt.isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-green-500'}`}
                        >
                          <CheckCircle size={14} />
                        </button>
                        <input 
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                          className="flex-1 bg-transparent text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400"
                        />
                        <button onClick={() => removeOption(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={addOption} className="mt-3 text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1">
                    <Plus size={16} /> Tambah Opsi
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={handleSaveQuestion}
                    disabled={loading || !selectedExamId}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Soal'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Question List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[calc(100vh-8rem)]">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">Daftar Soal</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {questions.length} soal untuk ujian ini
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {questions.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-10">
                    Belum ada soal.
                  </div>
                ) : (
                  questions.map((q, idx) => (
                    <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-xs font-bold text-slate-400 mb-1">Soal {idx + 1}</div>
                      <div className="text-sm text-slate-900 dark:text-white font-medium mb-2 line-clamp-2">{q.text}</div>
                      <div className="space-y-1">
                        {q.options.map((opt: any) => (
                          <div key={opt.id} className={`text-xs px-2 py-1 rounded ${opt.isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
                            {opt.text} {opt.isCorrect && '✓'}
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
      </main>
    </div>
  )
}
