"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { LogOut, Plus, Trash2, CheckCircle, ShieldCheck, Moon, Sun, Download, Upload, ShieldAlert, Library } from "lucide-react"
import { useTheme } from "@/hooks/useTheme";

export default function QuestionBank() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [questions, setQuestions] = useState<any[]>([])
  const [theme, setTheme] = useTheme()

  // Form states
  const [loading, setLoading] = useState(false)
  const [questionText, setQuestionText] = useState("")
  const [questionType, setQuestionType] = useState<"MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY">("MULTIPLE_CHOICE")
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [points, setPoints] = useState("1")
  const [difficulty, setDifficulty] = useState("MEDIUM")
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
      fetchQuestions()
    }
  }, [status, router])

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/questions`)
      const data = await res.json()
      if (data.success) {
        setQuestions(data.data)
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
    if (!questionText.trim()) return alert("Teks soal tidak boleh kosong")
    if (questionType === "MULTIPLE_CHOICE" && options.some(o => !o.text.trim())) return alert("Semua opsi jawaban harus diisi")
    if (questionType === "SHORT_ANSWER" && !correctAnswer.trim()) return alert("Kunci jawaban tidak boleh kosong")
    
    setLoading(true)
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: questionText,
          type: questionType,
          points: parseFloat(points) || 1,
          difficulty: difficulty,
          correctAnswer: questionType === "SHORT_ANSWER" ? correctAnswer : null,
          options: questionType === "MULTIPLE_CHOICE" ? options : [],
        }),
      })
      const data = await res.json()
      if (data.success) {
        setQuestionText("")
        setCorrectAnswer("")
        setPoints("1")
        setDifficulty("MEDIUM")
        setOptions([
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ])
        fetchQuestions()
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
              <Link href="/admin/questions" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Soal Ujian</Link>
              <Link href="/admin/question-bank" className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Bank Soal</Link>
              <Link href="/admin/grading" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Koreksi</Link>
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
            <h1 className={`text-3xl font-medium tracking-tight mb-2 flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
              <Library size={28} className={isDark ? "text-emerald-400" : "text-emerald-600"}/> 
              Pusat Bank Soal
            </h1>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Koleksi seluruh soal secara terpusat untuk digunakan di berbagai ujian.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Form (Minimal) */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Tambah Soal ke Bank
              </label>

              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <select 
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className={`w-full p-3 text-sm outline-none transition-colors border ${isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white focus:border-zinc-500' : 'bg-white border-zinc-200 text-black focus:border-zinc-400'}`}
                  >
                    <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                    <option value="SHORT_ANSWER">Isian Singkat</option>
                    <option value="ESSAY">Esai</option>
                  </select>
                </div>
                <div className="flex-1">
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className={`w-full p-3 text-sm outline-none transition-colors border ${isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white focus:border-zinc-500' : 'bg-white border-zinc-200 text-black focus:border-zinc-400'}`}
                  >
                    <option value="EASY">Mudah (Easy)</option>
                    <option value="MEDIUM">Sedang (Medium)</option>
                    <option value="HARD">Sulit (Hard)</option>
                  </select>
                </div>
                <div className="w-24">
                  <input 
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="Poin"
                    min="0"
                    step="0.5"
                    className={`w-full p-3 text-sm outline-none transition-colors border ${isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white focus:border-zinc-500' : 'bg-white border-zinc-200 text-black focus:border-zinc-400'}`}
                  />
                </div>
              </div>

              <textarea 
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Masukkan teks soal..."
                className={`w-full p-4 text-sm outline-none resize-y transition-colors border ${isDark ? 'bg-transparent border-zinc-800 text-white placeholder-zinc-700 focus:border-zinc-500' : 'bg-transparent border-zinc-200 text-black placeholder-zinc-300 focus:border-zinc-400'}`}
              />
            </div>

            {questionType === "MULTIPLE_CHOICE" && (
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
              
              <div className="flex justify-start items-center mt-6">
                <button onClick={addOption} className={`text-xs font-medium transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>
                  + Tambah Opsi
                </button>
              </div>
            </div>
            )}

            {questionType === "SHORT_ANSWER" && (
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Kunci Jawaban Singkat
                </label>
                <input 
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Ketik kunci jawaban persis..."
                  className={`w-full p-4 text-sm outline-none transition-colors border ${isDark ? 'bg-transparent border-zinc-800 text-white placeholder-zinc-700 focus:border-zinc-500' : 'bg-transparent border-zinc-200 text-black placeholder-zinc-300 focus:border-zinc-400'}`}
                />
              </div>
            )}

            <div className="flex justify-end items-center mt-6">
                <button 
                  onClick={handleSaveQuestion}
                  disabled={loading}
                  className={`px-6 py-2.5 text-xs font-medium rounded transition-colors disabled:cursor-not-allowed ${
                    isDark 
                      ? 'bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600' 
                      : 'bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400'
                  }`}
                >
                  {loading ? 'Menyimpan...' : 'Simpan ke Bank Soal'}
                </button>
            </div>
          </div>

          {/* Right Column: Question List (Minimal) */}
          <div className="lg:col-span-1">
            <div className={`text-xs font-bold uppercase tracking-widest mb-4 flex justify-between items-center ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              <span>Semua Soal</span>
              <span>{questions.length} Total</span>
            </div>
            
            <div className="space-y-0 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {questions.length === 0 ? (
                <div className={`py-10 text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Bank soal masih kosong.
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id} className={`py-4 border-b ${isDark ? 'border-zinc-900' : 'border-zinc-100'}`}>
                    <div className={`text-[10px] font-bold mb-2 uppercase tracking-widest flex justify-between items-center ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      <span>ID: {q.id.substring(q.id.length - 6)}</span>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <span className={`font-normal px-2 py-0.5 rounded ${q.difficulty === 'HARD' ? 'bg-rose-500/10 text-rose-500' : q.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {q.difficulty}
                        </span>
                        <span className="font-normal px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">{q.type === 'SHORT_ANSWER' ? 'IS' : q.type === 'ESSAY' ? 'ES' : 'PG'}</span>
                      </div>
                    </div>
                    <div className={`text-sm mb-3 leading-relaxed line-clamp-3 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{q.text}</div>
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
