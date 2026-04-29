"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Settings, LogOut, Download, Search, ShieldCheck, Moon, Sun } from "lucide-react"

export default function ResultsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [exams, setExams] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [resultsData, setResultsData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchExams()
    }
  }, [status, router])

  useEffect(() => {
    if (selectedExamId) {
      fetchResults(selectedExamId)
    } else {
      setResultsData(null)
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

  const fetchResults = async (examId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/exams/${examId}/results`)
      const data = await res.json()
      if (data.success) {
        setResultsData(data.data)
      } else {
        alert("Gagal memuat hasil: " + data.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!resultsData || !resultsData.results) return

    const headers = ["Nama Peserta", "Email", "Benar", "Salah", "Kosong", "Skor Akhir", "Status"]
    const rows = resultsData.results.map((r: any) => [
      `"${r.name}"`,
      `"${r.email}"`,
      r.correctAnswers,
      r.wrongAnswers,
      r.unanswered,
      r.score,
      r.isSubmitted ? "Sudah Mengerjakan" : "Belum Mengerjakan"
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Rekap_Nilai_${resultsData.examTitle.replace(/\s+/g, "_")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredResults = resultsData?.results?.filter((r: any) => 
    (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (r.email && r.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || []

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
              <Link href="/admin/questions" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Soal</Link>
              <Link href="/admin/results" className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Rekap Nilai</Link>
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
            <h1 className={`text-3xl font-medium tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Rekap Nilai</h1>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Lihat kalkulasi nilai dan unduh laporan akhir.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
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

            <button 
              onClick={exportToCSV}
              disabled={!resultsData || resultsData.results.length === 0}
              className={`px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap rounded disabled:cursor-not-allowed flex items-center gap-2 ${
                isDark 
                  ? 'bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600' 
                  : 'bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400'
              }`}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className={`text-xs font-medium uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {resultsData ? `Total Soal: ${resultsData.totalQuestions}` : 'Data Nilai'}
            </div>
            
            <div className="relative w-64">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} size={14} />
              <input 
                type="text" 
                placeholder="Cari nama/email..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-4 py-1.5 text-xs outline-none transition-colors border-b ${isDark ? 'bg-transparent border-zinc-800 text-white placeholder-zinc-600 focus:border-white' : 'bg-transparent border-zinc-200 text-black placeholder-zinc-400 focus:border-black'}`}
              />
            </div>
          </div>

          {/* Minimal Table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header */}
                <div className={`grid grid-cols-12 gap-4 pb-4 text-[10px] font-bold uppercase tracking-widest border-b ${isDark ? 'text-zinc-600 border-zinc-900' : 'text-zinc-400 border-zinc-100'}`}>
                  <div className="col-span-3">Nama</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-1 text-center">Benar</div>
                  <div className="col-span-1 text-center">Salah</div>
                  <div className="col-span-1 text-center">Kosong</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-1 text-right">Skor</div>
                </div>

                {/* Rows */}
                {!resultsData ? (
                  <div className={`py-12 text-center text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Pilih modul untuk memuat data
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className={`py-12 text-center text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Tidak ada data peserta
                  </div>
                ) : (
                  filteredResults.map((r: any) => (
                    <div key={r.id} className={`grid grid-cols-12 gap-4 py-4 items-center border-b transition-colors text-sm ${isDark ? 'border-zinc-900 hover:bg-zinc-900/30 text-zinc-300' : 'border-zinc-50 hover:bg-zinc-50 text-zinc-700'}`}>
                      <div className={`col-span-3 truncate font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{r.name}</div>
                      <div className={`col-span-3 truncate text-xs font-mono ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{r.email}</div>
                      <div className="col-span-1 text-center font-medium">{r.correctAnswers}</div>
                      <div className="col-span-1 text-center font-medium">{r.wrongAnswers}</div>
                      <div className={`col-span-1 text-center text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{r.unanswered}</div>
                      <div className="col-span-2 flex justify-center">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          r.isSubmitted 
                            ? isDark ? 'bg-white text-black' : 'bg-black text-white' 
                            : isDark ? 'text-zinc-600' : 'text-zinc-400'
                        }`}>
                          {r.isSubmitted ? 'Selesai' : 'Belum'}
                        </span>
                      </div>
                      <div className={`col-span-1 text-right font-light text-xl ${isDark ? 'text-white' : 'text-black'}`}>
                        {r.score}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
