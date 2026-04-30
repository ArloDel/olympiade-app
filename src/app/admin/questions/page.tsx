"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Settings, LogOut, Plus, Trash2, CheckCircle, ShieldCheck, Moon, Sun } from "lucide-react"

export default function QuestionsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [exams, setExams] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [questions, setQuestions] = useState<any[]>([])
  const [theme, setTheme] = useState<"dark" | "light">("dark")

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
      router.replace("/login")
    } else if (status === "authenticated") {
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
              <Link href="/admin/exams" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Ujian</Link>
              <Link href="/admin/questions" className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Soal</Link>
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
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className={`text-3xl font-medium tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Bank Soal</h1>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Kelola daftar pertanyaan dan struktur ujian.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              className={`w-full md:w-64 px-4 py-2.5 text-sm outline-none transition-colors border-b appearance-none cursor-pointer ${isDark ? 'bg-transparent border-zinc-800 text-white focus:border-white' : 'bg-transparent border-zinc-200 text-black focus:border-black'}`}
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              <option value="" disabled className={isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-zinc-400'}>-- Pilih Modul Ujian --</option>
              {exams.map(ex => (
                <option key={ex.id} value={ex.id} className={isDark ? 'bg-zinc-900' : 'bg-white'}>{ex.title}</option>
              ))}
            </select>
            <button onClick={handleCreateExam} className={`px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap rounded ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-black'}`}>
              + Ujian Baru
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Form (Minimal) */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Tulis Pertanyaan Baru
              </label>
              <textarea 
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Masukkan teks soal..."
                className={`w-full p-4 text-sm outline-none resize-y transition-colors border ${isDark ? 'bg-transparent border-zinc-800 text-white placeholder-zinc-700 focus:border-zinc-500' : 'bg-transparent border-zinc-200 text-black placeholder-zinc-300 focus:border-zinc-400'}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Opsi Jawaban
              </label>
              <div className="space-y-0">
                {options.map((opt, idx) => (
                  <div key={idx} className={`group flex items-center gap-4 py-3 border-b transition-colors ${isDark ? 'border-zinc-900 hover:bg-zinc-900/30' : 'border-zinc-50 hover:bg-zinc-50'}`}>
                    <button 
                      onClick={() => handleSetCorrect(idx)}
                      className={`flex-shrink-0 flex items-center justify-center transition-colors ${opt.isCorrect ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-zinc-700 hover:text-zinc-500' : 'text-zinc-300 hover:text-zinc-400')}`}
                    >
                      <CheckCircle size={16} />
                    </button>
                    <input 
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                      className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-zinc-300 placeholder-zinc-700' : 'text-zinc-700 placeholder-zinc-300'}`}
                    />
                    <button onClick={() => removeOption(idx)} className={`transition-colors opacity-0 group-hover:opacity-100 ${isDark ? 'text-zinc-600 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-6">
                <button onClick={addOption} className={`text-xs font-medium transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>
                  + Tambah Opsi
                </button>
                <button 
                  onClick={handleSaveQuestion}
                  disabled={loading || !selectedExamId}
                  className={`px-6 py-2.5 text-xs font-medium rounded transition-colors disabled:cursor-not-allowed ${
                    isDark 
                      ? 'bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600' 
                      : 'bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400'
                  }`}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Soal'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Question List (Minimal) */}
          <div className="lg:col-span-1">
            <div className={`text-xs font-bold uppercase tracking-widest mb-4 flex justify-between items-center ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              <span>Daftar Soal</span>
              <span>{questions.length}</span>
            </div>
            
            <div className="space-y-0">
              {questions.length === 0 ? (
                <div className={`py-10 text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Pilih modul untuk melihat soal.
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id} className={`py-4 border-b ${isDark ? 'border-zinc-900' : 'border-zinc-100'}`}>
                    <div className={`text-[10px] font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Soal {idx + 1}</div>
                    <div className={`text-sm mb-3 leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{q.text}</div>
                    <div className="space-y-1">
                      {q.options.map((opt: any) => (
                        <div key={opt.id} className={`text-xs flex items-center gap-2 ${opt.isCorrect ? (isDark ? 'text-white font-medium' : 'text-black font-medium') : (isDark ? 'text-zinc-600' : 'text-zinc-400')}`}>
                          {opt.isCorrect && <CheckCircle size={10} />}
                          <span className={opt.isCorrect ? '' : 'pl-4'}>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
