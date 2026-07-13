"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { LogOut, ShieldCheck, Moon, Sun, CheckCircle, ShieldAlert } from "lucide-react"
import { useTheme } from "@/hooks/useTheme";

export default function GradingManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [exams, setExams] = useState<Record<string, any>[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [answers, setAnswers] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useTheme()

  type FilterStatus = "UNGRADED" | "GRADED" | "ALL"
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("UNGRADED")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // For grading
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  async function fetchExams() {
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

  async function fetchAnswersToGrade(examId: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/grading?examId=${examId}`)
      const data = await res.json()
      if (data.success) {
        setAnswers(data.data)
        // Initialize inputs with existing scores
        const initialInputs: Record<string, string> = {}
        data.data.forEach((ans: Record<string, any>) => {
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchExams()
    }
  }, [status, router])

  useEffect(() => {
    if (selectedExamId) {
      setCurrentPage(1)
      setFilterStatus("UNGRADED")
      fetchAnswersToGrade(selectedExamId)
    } else {
      setAnswers([])
    }
  }, [selectedExamId])

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

  // Filter & Pagination Logic
  const filteredAnswers = answers.filter(ans => {
    if (filterStatus === "UNGRADED") return !ans.isGraded
    if (filterStatus === "GRADED") return ans.isGraded
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredAnswers.length / ITEMS_PER_PAGE))
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const paginatedAnswers = filteredAnswers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status)
    setCurrentPage(1)
  }

  const isDark = theme === "dark"

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-transparent text-zinc-300 selection:bg-indigo-500/30' : 'bg-white text-zinc-600 selection:bg-black/10'}`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-30 border-b ${isDark ? 'border-white/10 bg-black/40 backdrop-blur-xl' : 'border-zinc-100 bg-white/80'} backdrop-blur-md`}>
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
            Belum ada jawaban esai/isian yang masuk untuk modul ini.
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className={`flex items-center gap-4 mb-8 border-b overflow-x-auto ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <button 
                onClick={() => handleFilterChange("UNGRADED")}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${filterStatus === "UNGRADED" ? (isDark ? 'border-white text-white' : 'border-black text-black') : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
              >
                Belum Dinilai ({answers.filter(a => !a.isGraded).length})
              </button>
              <button 
                onClick={() => handleFilterChange("GRADED")}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${filterStatus === "GRADED" ? (isDark ? 'border-white text-white' : 'border-black text-black') : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
              >
                Sudah Dinilai ({answers.filter(a => a.isGraded).length})
              </button>
              <button 
                onClick={() => handleFilterChange("ALL")}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${filterStatus === "ALL" ? (isDark ? 'border-white text-white' : 'border-black text-black') : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
              >
                Semua ({answers.length})
              </button>
            </div>

            {paginatedAnswers.length === 0 ? (
              <div className={`py-20 text-center text-sm border-2 border-dashed rounded-xl ${isDark ? 'border-zinc-900 text-zinc-500' : 'border-zinc-100 text-zinc-500'}`}>
                {filterStatus === 'UNGRADED' ? 'Hore! Semua jawaban di modul ini sudah Anda nilai. 🎉' : 'Tidak ada data di kategori ini.'}
              </div>
            ) : (
              <div className="space-y-6">
                {paginatedAnswers.map((ans, idx) => (
              <div key={ans.id} className={`p-6 rounded-xl transition-colors ${isDark ? 'glass-panel glow-border' : 'border bg-zinc-50 border-zinc-200'}`}>
                
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

                <div className={`mb-6 p-4 rounded-lg text-sm leading-relaxed ${isDark ? 'glass-panel glow-border text-zinc-300' : 'bg-white text-zinc-700'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Soal:</div>
                  {ans.question.text}
                  
                  {ans.question.correctAnswer && (
                    <div className="mt-4 pt-4 border-t border-dashed border-zinc-500/30">
                      <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Kunci Jawaban:</div>
                      <span className="font-mono text-xs">{ans.question.correctAnswer}</span>
                    </div>
                  )}
                </div>

                <div className={`mb-6 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'glass-panel glow-border text-white' : 'bg-zinc-100 text-black'}`}>
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className={`flex items-center justify-between pt-6 mt-8 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors disabled:opacity-30 ${isDark ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-zinc-100 text-black hover:bg-zinc-200'}`}
                >
                  Sebelumnya
                </button>
                <span className={`text-sm font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors disabled:opacity-30 ${isDark ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-zinc-100 text-black hover:bg-zinc-200'}`}
                >
                  Selanjutnya
                </button>
              </div>
            )}
            
          </div>
            )}
          </>
        )}
      </main>

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
