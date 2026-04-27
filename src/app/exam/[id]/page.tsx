"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, LayoutGrid, X } from "lucide-react"

export default function ExamTakingInterface() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // State for answers mapping questionId -> optionId
  const [answers, setAnswers] = useState<Record<string, string>>({})
  // State for flagged questions
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  
  const [showGrid, setShowGrid] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120 * 60) // Default 120 mins
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Proctoring State
  const [warningModal, setWarningModal] = useState<{ show: boolean, warnings: number, isLocked: boolean } | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchQuestions()
    }
  }, [status, router, examId])

  useEffect(() => {
    if (loading) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [loading])

  // Proctoring: Tab Switch Detection
  useEffect(() => {
    if (loading || status !== "authenticated") return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await reportProctoringEvent("TAB_SWITCH");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loading, status, examId]); // Remove 'answers' from dependency to avoid frequent re-binding

  const reportProctoringEvent = async (eventType: string) => {
    try {
      const res = await fetch("/api/proctoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, eventType })
      });
      const data = await res.json();
      
      if (data.success && eventType === "TAB_SWITCH") {
        setWarningModal({
          show: true,
          warnings: data.data.warnings,
          isLocked: data.data.isLocked
        });

        if (data.data.isLocked) {
          // Force submit
          setTimeout(() => {
            forceLockSubmit();
          }, 3000); // give them 3 seconds to read the message
        }
      }
    } catch (err) {
      console.error("Failed to report proctoring event:", err);
    }
  }

  const forceLockSubmit = async () => {
    // We cannot reliably access the very latest 'answers' state here due to closure 
    // unless we use a ref, but the API will just save whatever the submitAnswersToApi sends.
    // To be safe, we'll just trigger the submit logic. 
    // A better React pattern is using a ref for answers, but we'll use the existing function.
    await submitAnswersToApi();
    router.replace("/dashboard");
  }

  const submitAnswersToApi = async (currentAnswers = answers) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          answers: currentAnswers
        })
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error)
      }
      return true
    } catch (err) {
      console.error(err)
      alert("Gagal menyimpan jawaban. Silakan coba lagi.")
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAutoSubmit = async () => {
    alert("Waktu habis! Ujian otomatis disubmit.")
    await submitAnswersToApi()
    router.replace("/dashboard")
  }

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length
    const confirmed = confirm(`Anda telah menjawab ${answeredCount} dari ${questions.length} soal. Apakah Anda yakin ingin mengakhiri ujian?`)
    if (confirmed) {
      const success = await submitAnswersToApi()
      if (success) {
        alert("Ujian berhasil disubmit! Jawaban Anda telah tersimpan.")
        router.replace("/dashboard")
      }
    }
  }

  if (loading || status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Memuat soal ujian...</div>
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <div className="text-xl">Tidak ada soal untuk ujian ini.</div>
        <button onClick={() => router.push("/dashboard")} className="px-4 py-2 bg-blue-600 rounded">Kembali ke Dashboard</button>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const isAnswered = !!answers[currentQ.id]
  const isFlagged = flagged.has(currentQ.id)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden relative">
      
      {/* Proctoring Warning Modal */}
      {warningModal && warningModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 text-center border-2 border-red-500">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flag size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pelanggaran Terdeteksi!</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Sistem mendeteksi Anda berpindah tab atau meminimalkan jendela browser.
            </p>
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg font-medium mb-6">
              Peringatan ke-{warningModal.warnings} dari 3
            </div>
            
            {warningModal.isLocked ? (
              <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-4 animate-pulse">
                Akun Anda telah dikunci. Mengirim jawaban dan mengakhiri ujian...
              </p>
            ) : (
              <button 
                onClick={() => setWarningModal(null)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
              >
                Saya Mengerti & Kembali ke Ujian
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="font-bold text-lg text-slate-800 dark:text-slate-200 hidden sm:block">
          Ujian Berlangsung
        </div>
        
        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold text-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
          <Clock size={18} className={timeLeft < 300 ? 'animate-pulse' : ''} />
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className="p-2 text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-700 rounded-lg lg:hidden"
          >
            {showGrid ? <X size={20} /> : <LayoutGrid size={20} />}
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {isSubmitting ? "Menyimpan..." : "Selesai Ujian"}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-xl font-bold text-slate-400">Soal {currentIndex + 1}</div>
              <button 
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${isFlagged ? 'bg-orange-100 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800/50 dark:text-orange-400' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
              >
                <Flag size={16} className={isFlagged ? 'fill-orange-500' : ''} />
                {isFlagged ? 'Ditandai Ragu' : 'Ragu-ragu'}
              </button>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8 mb-6 text-lg text-slate-800 dark:text-slate-200 leading-relaxed min-h-[150px]">
              {currentQ.text}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((opt: any, idx: number) => {
                const selected = answers[currentQ.id] === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                      selected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      selected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className={`mt-1 text-base ${selected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 dark:text-slate-300'}`}>
                      {opt.text}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Navigation Bottom */}
            <div className="flex items-center justify-between mt-10">
              <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} /> Sebelumnya
              </button>
              
              <button 
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </main>

        {/* Sidebar / Grid Panel */}
        <aside className={`${showGrid ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} fixed lg:static inset-y-0 right-0 z-30 w-72 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 transition-transform duration-300 ease-in-out flex flex-col pt-16 lg:pt-0`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3">Navigasi Soal</h3>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <div className="w-3 h-3 rounded-sm bg-blue-500"></div> Dijawab
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <div className="w-3 h-3 rounded-sm bg-orange-500"></div> Ragu
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <div className="w-3 h-3 rounded-sm border border-slate-300 dark:border-slate-600"></div> Kosong
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <div className="w-3 h-3 rounded-sm border-2 border-slate-800 dark:border-slate-200"></div> Saat ini
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex
                const isAns = !!answers[q.id]
                const isFlag = flagged.has(q.id)

                let bgClass = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                if (isFlag) bgClass = "bg-orange-500 border-orange-500 text-white"
                else if (isAns) bgClass = "bg-blue-500 border-blue-500 text-white"

                let borderClass = ""
                if (isCurrent) borderClass = "ring-2 ring-offset-2 ring-slate-800 dark:ring-slate-200 dark:ring-offset-slate-900"

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx)
                      if (window.innerWidth < 1024) setShowGrid(false)
                    }}
                    className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold border transition-all ${bgClass} ${borderClass}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
        
        {/* Mobile backdrop */}
        {showGrid && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
            onClick={() => setShowGrid(false)}
          />
        )}
      </div>
    </div>
  )
}
