"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Settings, LogOut, Download, Search } from "lucide-react"

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
              <Link href="/admin/questions" className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-sm font-medium transition-colors">Manajemen Soal</Link>
              <Link href="/admin/results" className="px-3 py-2 bg-slate-800 rounded-md text-sm font-medium">Rekap Nilai</Link>
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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rekap Nilai Ujian</h1>
              <p className="text-slate-500 mt-1">Lihat dan unduh hasil ujian peserta</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white w-full md:w-64 shadow-sm"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                <option value="" disabled>-- Pilih Ujian --</option>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.title}</option>
                ))}
              </select>

              <button 
                onClick={exportToCSV}
                disabled={!resultsData || resultsData.results.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                {resultsData ? `Total Soal: ${resultsData.totalQuestions}` : "Pilih ujian untuk melihat data"}
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari nama atau email..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-10 text-slate-500">Memuat data nilai...</div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3 font-medium">Nama Peserta</th>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium text-center">Benar</th>
                      <th className="px-6 py-3 font-medium text-center">Salah</th>
                      <th className="px-6 py-3 font-medium text-center">Kosong</th>
                      <th className="px-6 py-3 font-medium text-center">Status</th>
                      <th className="px-6 py-3 font-medium text-right">Skor Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {!resultsData ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                          Data tidak tersedia
                        </td>
                      </tr>
                    ) : filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                          Tidak ada peserta yang cocok dengan pencarian
                        </td>
                      </tr>
                    ) : (
                      filteredResults.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                            {r.name}
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                            {r.email}
                          </td>
                          <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-medium">
                            {r.correctAnswers}
                          </td>
                          <td className="px-6 py-4 text-center text-red-600 dark:text-red-400 font-medium">
                            {r.wrongAnswers}
                          </td>
                          <td className="px-6 py-4 text-center text-slate-400">
                            {r.unanswered}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {r.isSubmitted ? (
                              <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs font-semibold">Selesai</span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded text-xs font-semibold">Belum</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold rounded-lg border border-blue-200 dark:border-blue-800">
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
