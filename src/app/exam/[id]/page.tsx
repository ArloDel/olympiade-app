"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Clock, Flag, ChevronLeft, ChevronRight, AlertCircle, Maximize, Minimize } from "lucide-react"
import Webcam from "react-webcam"
import { QuestionRenderer } from "@/components/QuestionRenderer"

// MOCK DATA
const MOCK_QUESTIONS = [
  {
    id: "q1",
    order: 1,
    text: "<p>Berapakah hasil dari integral berikut?</p><p>$$\\int_0^1 x^2 \\, dx$$</p>",
    options: [
      { id: "opt1_1", text: "$1/3$" },
      { id: "opt1_2", text: "$1/2$" },
      { id: "opt1_3", text: "$1$" },
      { id: "opt1_4", text: "$0$" },
    ]
  },
  {
    id: "q2",
    order: 2,
    text: "<p>Jika $f(x) = e^x$, tentukan turunan kedua dari $f(x)$ di titik $x = 0$.</p>",
    options: [
      { id: "opt2_1", text: "$0$" },
      { id: "opt2_2", text: "$1$" },
      { id: "opt2_3", text: "$e$" },
      { id: "opt2_4", text: "$2$" },
    ]
  },
  {
    id: "q3",
    order: 3,
    text: "<p>Selesaikan persamaan diferensial $y'' + y = 0$ dengan syarat batas $y(0) = 0$ dan $y'(0) = 1$.</p>",
    options: [
      { id: "opt3_1", text: "$y = \\cos(x)$" },
      { id: "opt3_2", text: "$y = \\sin(x)$" },
      { id: "opt3_3", text: "$y = e^x$" },
      { id: "opt3_4", text: "$y = e^{-x}$" },
    ]
  }
]

export default function ExamPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  
  const [timeLeft, setTimeLeft] = useState(7200) // 2 hours
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const [warnings, setWarnings] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleFinish()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Anti-Cheat: Visibility Change (Tab Switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(prev => {
          const newWarnings = prev + 1
          alert(`PERINGATAN: Anda mendeteksi berpindah tab/aplikasi. Peringatan ke-${newWarnings}/3.`)
          if (newWarnings >= 3) {
            // LOCKOUT
            handleLockout()
          }
          return newWarnings
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  const handleLockout = () => {
    alert("Ujian Anda telah dikunci karena terlalu banyak pelanggaran.")
    router.replace("/dashboard")
  }

  const handleFinish = () => {
    if (confirm("Apakah Anda yakin ingin menyelesaikan ujian?")) {
      router.replace("/dashboard")
    }
  }

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }))
    // Simulate API Auto-save debounce could be placed here
  }

  const toggleFlag = (questionId: string) => {
    setFlags(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }))
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (status === "loading" || !session) return <div>Loading...</div>

  const currentQuestion = MOCK_QUESTIONS[currentQIndex]

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar - Question Navigation */}
      <div className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 mb-1">Olimpiade Matematika Nasional</div>
          <div className="font-bold">Peserta: {session.user.name || "Siswa"}</div>
        </div>
        
        {/* Webcam Area */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Proctoring Camera</div>
          <div className="bg-slate-900 rounded overflow-hidden aspect-video relative">
            <Webcam
              audio={false}
              className="w-full h-full object-cover"
              mirrored={true}
            />
            {/* Simulation of periodic snapshot: we would capture image here periodically */}
          </div>
        </div>

        {/* Question Grid */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold uppercase text-slate-500 mb-3">Navigasi Soal</div>
          <div className="grid grid-cols-5 gap-2">
            {MOCK_QUESTIONS.map((q, idx) => {
              const isAnswered = !!answers[q.id]
              const isFlagged = !!flags[q.id]
              const isCurrent = currentQIndex === idx
              
              let btnClass = "h-10 w-10 rounded border font-medium text-sm flex items-center justify-center transition-colors relative "
              
              if (isCurrent) {
                btnClass += "border-blue-500 ring-2 ring-blue-500/30 "
              } else {
                btnClass += "border-slate-200 dark:border-slate-700 "
              }
              
              if (isAnswered) {
                btnClass += "bg-blue-600 text-white border-blue-600 "
              } else {
                btnClass += "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 "
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={btnClass}
                >
                  {q.order}
                  {isFlagged && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleFullscreen}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            
            {warnings > 0 && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/30 px-3 py-1 rounded-full border border-red-200 dark:border-red-800">
                <AlertCircle size={16} />
                Peringatan: {warnings}/3
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xl font-bold font-mono">
              <Clock size={20} className={timeLeft < 600 ? "text-red-500" : "text-slate-500"} />
              <span className={timeLeft < 600 ? "text-red-500" : ""}>{formatTime(timeLeft)}</span>
            </div>
            <button 
              onClick={handleFinish}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Selesai Ujian
            </button>
          </div>
        </header>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="max-w-3xl mx-auto">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Soal No. {currentQuestion.order}</h2>
              <button
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors ${
                  flags[currentQuestion.id] 
                    ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700" 
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <Flag size={18} className={flags[currentQuestion.id] ? "fill-current" : ""} />
                {flags[currentQuestion.id] ? "Ragu-ragu (Ditandai)" : "Tandai Ragu"}
              </button>
            </div>

            {/* Question Text with KaTeX renderer */}
            <div className="mb-10 text-lg">
              <QuestionRenderer content={currentQuestion.text} />
            </div>

            {/* Options */}
            <div className="space-y-4">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = answers[currentQuestion.id] === opt.id
                const letters = ['A', 'B', 'C', 'D', 'E']
                return (
                  <label 
                    key={opt.id}
                    className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500" 
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700"
                    }`}
                  >
                    <div className="flex items-center h-6 mr-4">
                      <input 
                        type="radio" 
                        name={`q-${currentQuestion.id}`}
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => handleAnswer(currentQuestion.id, opt.id)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                    </div>
                    <div className="flex-1 flex gap-4">
                      <span className="font-bold text-slate-500">{letters[i]}.</span>
                      <div>
                        <QuestionRenderer content={opt.text} />
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <footer className="h-20 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQIndex === 0}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
            Soal Sebelumnya
          </button>

          <button
            onClick={() => setCurrentQIndex(prev => Math.min(MOCK_QUESTIONS.length - 1, prev + 1))}
            disabled={currentQIndex === MOCK_QUESTIONS.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Soal Berikutnya
            <ChevronRight size={20} />
          </button>
        </footer>
      </div>
    </div>
  )
}
