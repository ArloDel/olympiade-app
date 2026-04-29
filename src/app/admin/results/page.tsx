"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Settings, LogOut, Download, Search, ShieldCheck } from "lucide-react"

export default function ResultsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [exams, setExams] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [resultsData, setResultsData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

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
              <Link href="/admin/questions" className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-all">Soal</Link>
              <Link href="/admin/results" className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium border border-white/10 shadow-sm transition-all">Rekap Nilai</Link>
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
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent blur-[100px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Rekap Nilai Ujian</h1>
              <p className="text-zinc-400">Lihat kalkulasi nilai dan unduh laporan lengkap peserta.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-sm px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-white w-full md:w-64 shadow-lg transition-all hover:bg-white/10"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                <option value="" disabled className="bg-zinc-900 text-zinc-400">-- Pilih Ujian --</option>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id} className="bg-zinc-900">{ex.title}</option>
                ))}
              </select>

              <button 
                onClick={exportToCSV}
                disabled={!resultsData || resultsData.results.length === 0}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
            
            <div className="p-5 border-b border-white/10 flex justify-between items-center relative z-10 bg-white/[0.01]">
              <div className="font-semibold text-zinc-300 flex items-center gap-2">
                {resultsData ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Total Soal: <span className="text-white">{resultsData.totalQuestions}</span>
                  </>
                ) : (
                  "Pilih ujian untuk memuat data"
                )}
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari nama atau email..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-black/20 border border-white/5 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder-zinc-500 transition-all hover:bg-black/30"
                />
              </div>
            </div>

            <div className="overflow-x-auto relative z-10">
              {loading ? (
                <div className="text-center py-20 text-zinc-500 flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-medium">Mengalkulasi nilai peserta...</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-black/20 text-zinc-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold tracking-wide text-xs uppercase">Nama Peserta</th>
                      <th className="px-6 py-4 font-semibold tracking-wide text-xs uppercase">Email</th>
                      <th className="px-6 py-4 font-semibold tracking-wide text-xs uppercase text-center">Benar</th>
                      <th className="px-6 py-4 font-semibold tracking-wide text-xs uppercase text-center">Salah</th>
                      <th className="px-6 py-4 font-semibold tracking-wide text-xs uppercase text-center">Kosong</th>
                      <th className="px-6 py-4 font-semibold tracking-wide text-xs uppercase text-center">Status</th>
                      <th className="px-6 py-4 font-semibold tracking-wide text-xs uppercase text-right">Skor Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {!resultsData ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-medium">
                          Data tidak tersedia
                        </td>
                      </tr>
                    ) : filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-medium">
                          Tidak ada peserta yang cocok dengan pencarian
                        </td>
                      </tr>
                    ) : (
                      filteredResults.map((r: any) => (
                        <tr key={r.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="px-6 py-4 font-medium text-white">
                            {r.name}
                          </td>
                          <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                            {r.email}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md">{r.correctAnswers}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-md">{r.wrongAnswers}</span>
                          </td>
                          <td className="px-6 py-4 text-center text-zinc-500 font-medium">
                            {r.unanswered}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {r.isSubmitted ? (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">Selesai</span>
                            ) : (
                              <span className="bg-zinc-800 text-zinc-400 border border-white/5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">Belum</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center justify-center min-w-[3.5rem] px-3 py-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 font-bold rounded-lg border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                              {r.score}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
