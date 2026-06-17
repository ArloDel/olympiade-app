"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { LogOut, ShieldCheck, Moon, Sun, CheckCircle } from "lucide-react"

export default function GradingManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [exams, setExams] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  // For grading
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchExams()
    }
  }, [status, router])

  useEffect(() => {
    if (selectedExamId) {
      fetchAnswersToGrade(selectedExamId)
    } else {
      setAnswers([])
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

  const fetchAnswersToGrade = async (examId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/grading?examId=${examId}`)
      const data = await res.json()
      if (data.success) {
        setAnswers(data.data)
        // Initialize inputs with existing scores
        const initialInputs: Record<string, string> = {}
        data.data.forEach((ans: any) => {
          if (ans.score !== null) {
            initialInputs[ans.id] = ans.score.toString()
          }
        })
        setScoreInputs(initialInputs)
      } else {
        alert("Gagal memuat jawaban: " + data.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (id: string, val: string) => {
    setScoreInputs(prev => ({ ...prev, [id]: val }))
  }

  const submitScore = async (answerId: string, maxPoints: number) => {
    const scoreVal = scoreInputs[answerId]
    if (scoreVal === undefined || scoreVal.trim() === "") {
      return alert("Masukkan nilai terlebih dahulu")
    }

    const parsedScore = parseFloat(scoreVal);
    if (parsedScore < 0 || parsedScore > maxPoints) {
      return alert(`Nilai harus berada di antara 0 hingga bobot maksimal (${maxPoints} poin)`);
    }

    setSubmittingId(answerId)
    try {
      const res = await fetch("/api/admin/grading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerId, score: scoreVal })
      })
      const data = await res.json()
      if (data.success) {
        // Update local state to reflect it's graded
        setAnswers(prev => prev.map(a => a.id === answerId ? { ...a, isGraded: true, score: parseFloat(scoreVal) } : a))
      } else {
        alert("Gagal menyimpan nilai: " + data.error)
      }
    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan sistem")
    } finally {
      setSubmittingId(null)
    }
  }

  const isDark = theme === "dark"

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-zinc-300 selection:bg-white/20' : 'bg-white text-zinc-600 selection:bg-black/10'}`}>
      
      {/* Header */}
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
              <Link href="/admin/questions" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Soal</Link>
              <Link href="/admin/grading" className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Koreksi</Link>
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
      <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className={`text-3xl font-medium tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Koreksi Jawaban</h1>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Beri nilai manual untuk jawaban tipe Esai dan Isian Singkat.</p>
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
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
          </div>
        ) : answers.length === 0 ? (
          <div className={`py-20 text-center text-sm border-2 border-dashed rounded-xl ${isDark ? 'border-zinc-900 text-zinc-600' : 'border-zinc-100 text-zinc-400'}`}>
            Tidak ada jawaban esai/isian yang perlu dikoreksi.
          </div>
        ) : (
          <div className="space-y-6">
            {answers.map((ans, idx) => (
              <div key={ans.id} className={`p-6 border rounded-xl transition-colors ${isDark ? 'bg-[#0f0f0f] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      Siswa: <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{ans.user.name}</span> ({ans.user.email})
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isDark ? 'bg-white/10 text-zinc-300' : 'bg-black/5 text-zinc-600'}`}>
                        {ans.question.type === 'ESSAY' ? 'Esai' : 'Isian Singkat'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${isDark ? 'bg-white/10 text-zinc-300' : 'bg-black/5 text-zinc-600'}`}>
                        Bobot: {ans.question.points} Poin
                      </span>
                      {ans.isGraded && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
                          <CheckCircle size={10} /> Dinilai
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`mb-6 p-4 rounded-lg text-sm leading-relaxed ${isDark ? 'bg-black text-zinc-300' : 'bg-white text-zinc-700'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Soal:</div>
                  {ans.question.text}
                  
                  {ans.question.correctAnswer && (
                    <div className="mt-4 pt-4 border-t border-dashed border-zinc-500/30">
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Kunci Jawaban:</div>
                      <span className="font-mono text-xs">{ans.question.correctAnswer}</span>
                    </div>
                  )}
                </div>

                <div className={`mb-6 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-black'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Jawaban Siswa:</div>
                  {ans.textAnswer || <span className="italic opacity-50">Kosong</span>}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <div className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Beri Nilai:</div>
                  <input 
                    type="number"
                    min="0"
                    max={ans.question.points}
                    step="0.5"
                    value={scoreInputs[ans.id] || ""}
                    onChange={(e) => handleScoreChange(ans.id, e.target.value)}
                    placeholder={`0 - ${ans.question.points}`}
                    className={`w-24 p-2 text-sm text-center outline-none transition-colors border rounded ${isDark ? 'bg-black border-zinc-700 text-white focus:border-white' : 'bg-white border-zinc-300 text-black focus:border-black'}`}
                  />
                  <button 
                    onClick={() => submitScore(ans.id, ans.question.points)}
                    disabled={submittingId === ans.id}
                    className={`px-4 py-2 text-xs font-medium transition-colors rounded disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
                  >
                    {submittingId === ans.id ? 'Menyimpan...' : 'Simpan Nilai'}
                  </button>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
