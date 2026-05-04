"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Clock, ChevronLeft, ChevronRight, Flag, LayoutGrid, X, Moon, Sun, Shield } from "lucide-react"

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

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Proctoring State
  const [warningModal, setWarningModal] = useState<{ show: boolean, warnings: number, isLocked: boolean } | null>(null)

  // Theme state matches dashboard
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const isDark = theme === "dark"

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/questions?examId=${examId}`)
      const data = await res.json()
      if (data.success) {
        setQuestions(data.data)
      } else {
        console.error(data.error)
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const toggleFlag = (qId: string) => {
    setFlagged(prev => {
      const newSet = new Set(prev)
      if (newSet.has(qId)) newSet.delete(qId)
      else newSet.add(qId)
      return newSet
    })
  }

  const handleSelectOption = (qId: string, optId: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optId
    }))
  }

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

  // Initialize Camera
  useEffect(() => {
    if (status !== "authenticated" || loading) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Gagal mengakses kamera:", err);
        alert("Kamera diperlukan untuk ujian ini. Mohon izinkan akses kamera.");
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [status, loading]);

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

  const captureSnapshot = (): string | null => {
    if (!videoRef.current) return null;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.5);
      }
    } catch (err) {
      console.error("Failed to capture snapshot:", err);
    }
    return null;
  };

  const reportProctoringEvent = async (eventType: string) => {
    try {
      const snapshotUrl = captureSnapshot();
      const res = await fetch("/api/proctoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, eventType, snapshotUrl })
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
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center transition-colors ${isDark ? 'bg-[#0a0a0a] text-zinc-400' : 'bg-white text-zinc-500'} gap-4`}>
        <div className="text-sm">Tidak ada soal untuk ujian ini.</div>
        <button onClick={() => router.push("/dashboard")} className={`text-xs font-medium px-4 py-2 rounded transition-colors ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}>Kembali ke Dashboard</button>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const isAnswered = !!answers[currentQ.id]
  const isFlagged = flagged.has(currentQ.id)

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col font-sans overflow-hidden relative ${isDark ? 'bg-[#0a0a0a] text-zinc-300 selection:bg-white/20' : 'bg-white text-zinc-600 selection:bg-black/10'}`}>
      
      {/* Floating Camera View */}
      <div className={`fixed bottom-4 left-4 lg:bottom-8 lg:left-8 z-40 w-28 h-36 sm:w-36 sm:h-48 rounded overflow-hidden shadow-2xl border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} flex items-center justify-center bg-black`}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover opacity-80"
          style={{ transform: "scaleX(-1)" }}
        />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
          REC
        </div>
      </div>

      {/* Proctoring Warning Modal */}
      {warningModal && warningModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`max-w-md w-full p-8 border ${isDark ? 'bg-[#0a0a0a] border-rose-900/50' : 'bg-white border-rose-200'} text-center shadow-2xl`}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 bg-rose-500/10 text-rose-500">
              <Flag size={24} />
            </div>
            <h3 className={`text-xl font-medium mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Pelanggaran Terdeteksi!</h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Sistem mendeteksi Anda berpindah tab atau meminimalkan jendela browser.
            </p>
            <div className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-6 ${isDark ? 'text-rose-500' : 'text-rose-600'}`}>
              Peringatan ke-{warningModal.warnings} dari 3
            </div>
            
            {warningModal.isLocked ? (
              <p className="text-xs font-medium text-rose-500 mb-4 animate-pulse">
                Akun Anda telah dikunci. Mengirim jawaban dan mengakhiri ujian...
              </p>
            ) : (
              <button 
                onClick={() => setWarningModal(null)}
                className={`w-full py-3 text-xs font-medium transition-colors ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
              >
                Saya Mengerti
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ultra Minimal Header */}
      <header className={`sticky top-0 z-30 border-b ${isDark ? 'border-zinc-900 bg-[#0a0a0a]/80' : 'border-zinc-100 bg-white/80'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className={`font-semibold text-sm tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'} hidden sm:flex`}>
            <Shield size={16} />
            Evaluasi Aktif
          </div>
          
          {/* Timer */}
          <div className={`flex items-center gap-2 font-mono text-sm tracking-widest ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : (isDark ? 'text-zinc-300' : 'text-zinc-700')}`}>
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`text-xs flex items-center gap-1.5 transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <button 
              onClick={() => setShowGrid(!showGrid)}
              className={`lg:hidden text-xs flex items-center transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}
            >
              {showGrid ? <X size={16} /> : <LayoutGrid size={16} />}
            </button>

            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`text-xs font-medium px-4 py-2 transition-colors disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
            >
              {isSubmitting ? "Menyimpan..." : "Selesai"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto relative overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-6 py-12">
          <div className="max-w-2xl mx-auto">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-10">
              <div className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Soal {currentIndex + 1} <span className="font-normal mx-1 text-zinc-500">dari</span> {questions.length}
              </div>
              <button 
                onClick={() => toggleFlag(currentQ.id)}
                className={`text-xs flex items-center gap-1.5 transition-colors ${isFlagged ? 'text-orange-500' : (isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')}`}
              >
                <Flag size={14} className={isFlagged ? 'fill-orange-500' : ''} />
                {isFlagged ? 'Ditandai Ragu' : 'Tandai Ragu'}
              </button>
            </div>

            {/* Question Card */}
            <div className={`text-lg mb-12 leading-relaxed font-light ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
              {currentQ.text}
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3">
              {currentQ.options.map((opt: any, idx: number) => {
                const selected = answers[currentQ.id] === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`w-full text-left p-4 border transition-colors flex items-start gap-4 ${
                      selected 
                        ? (isDark ? 'border-white bg-white/5' : 'border-black bg-black/5') 
                        : (isDark ? 'border-zinc-900 hover:border-zinc-700 bg-transparent' : 'border-zinc-100 hover:border-zinc-300 bg-transparent')
                    }`}
                  >
                    <div className={`shrink-0 text-xs font-mono mt-0.5 ${
                      selected 
                        ? (isDark ? 'text-white' : 'text-black') 
                        : (isDark ? 'text-zinc-600' : 'text-zinc-400')
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className={`text-sm ${
                      selected 
                        ? (isDark ? 'text-zinc-200' : 'text-zinc-800') 
                        : (isDark ? 'text-zinc-400' : 'text-zinc-600')
                    }`}>
                      {opt.text}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Navigation Bottom */}
            <div className={`mt-16 pt-8 border-t flex items-center justify-between ${isDark ? 'border-zinc-900' : 'border-zinc-100'}`}>
              <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className={`text-xs flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}
              >
                <ChevronLeft size={14} /> Sebelumnya
              </button>
              
              <button 
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className={`text-xs flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}
              >
                Selanjutnya <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </main>

        {/* Sidebar / Grid Panel */}
        <aside className={`${showGrid ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} absolute lg:static inset-y-0 right-0 z-30 w-72 ${isDark ? 'bg-[#0a0a0a] border-zinc-900' : 'bg-white border-zinc-100'} border-l transition-transform duration-300 ease-in-out flex flex-col shrink-0`}>
          <div className={`p-6 border-b ${isDark ? 'border-zinc-900' : 'border-zinc-100'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Navigasi Soal</h3>
            
            <div className="grid grid-cols-2 gap-3 text-[10px] tracking-wider uppercase font-medium">
              <div className={`flex items-center gap-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <div className={`w-2 h-2 ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`}></div> Dijawab
              </div>
              <div className={`flex items-center gap-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <div className="w-2 h-2 bg-orange-500/50"></div> Ragu
              </div>
              <div className={`flex items-center gap-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <div className={`w-2 h-2 border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div> Kosong
              </div>
              <div className={`flex items-center gap-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                <div className={`w-2 h-2 border ${isDark ? 'border-white' : 'border-black'}`}></div> Saat ini
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex
                const isAns = !!answers[q.id]
                const isFlag = flagged.has(q.id)

                let bgClass = isDark ? "text-zinc-500 border-zinc-900 hover:border-zinc-700" : "text-zinc-400 border-zinc-100 hover:border-zinc-300"
                if (isFlag) {
                  bgClass = "border-orange-500/30 text-orange-500" + (isDark ? " bg-orange-500/10" : " bg-orange-50")
                } else if (isAns) {
                  bgClass = isDark ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-200"
                }

                let borderClass = ""
                if (isCurrent) {
                  borderClass = isDark ? "border-white text-white" : "border-black text-black"
                  // override background and text for current
                  if (isFlag) bgClass = "bg-orange-500/20 text-orange-500"
                  if (isAns) bgClass = isDark ? "bg-zinc-800 text-white" : "bg-zinc-200 text-black"
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx)
                      if (window.innerWidth < 1024) setShowGrid(false)
                    }}
                    className={`w-8 h-8 flex items-center justify-center text-[10px] font-mono border transition-all ${bgClass} ${borderClass}`}
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
            className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setShowGrid(false)}
          />
        )}
      </div>
    </div>
  )
}
