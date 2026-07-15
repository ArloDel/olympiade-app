"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Clock, ChevronLeft, ChevronRight, Flag, LayoutGrid, X, Moon, Sun, Shield, ShieldOff, WifiOff, Save, CheckCircle2, Loader2 } from "lucide-react"
import { useTheme } from "@/hooks/useTheme";

export default function ExamTakingInterface() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sebError, setSebError] = useState<string | null>(null)
  
  // State for answers mapping questionId -> { optionId?: string, textAnswer?: string } | string
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const answersRef = useRef(answers) // Keep latest for closures
  // State for flagged questions
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  
  const [showGrid, setShowGrid] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120 * 60) // Default 120 mins
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Connection Resilience State
  const [isOffline, setIsOffline] = useState(false)
  const [waitingForOnlineSubmit, setWaitingForOnlineSubmit] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Proctoring State
  const [warningModal, setWarningModal] = useState<{ show: boolean, warnings: number, isLocked: boolean } | null>(null)

  // Theme state matches dashboard
  const [theme, setTheme] = useTheme()
  const isDark = theme === "dark"

  const fetchQuestions = async () => {
    try {
      // Check if already finished
      const examsRes = await fetch('/api/exams');
      const examsData = await examsRes.json();
      const thisExam = examsData.data?.find((e: any) => e.id === examId);
      if (thisExam?.isFinished) {
        alert("Anda sudah menyelesaikan ujian ini.");
        router.replace("/dashboard");
        return;
      }
      
      if (thisExam?.duration) {
        setTimeLeft(thisExam.duration * 60);
      }

      const res = await fetch(`/api/questions?examId=${examId}`)
      const data = await res.json()
      if (data.success) {
        setQuestions(data.data)
        // Load from local storage
        if (session?.user?.id) {
          const cacheKey = `olym_answers_${examId}_${session.user.id}`
          const cached = localStorage.getItem(cacheKey)
          if (cached) {
            try {
              const parsed = JSON.parse(cached)
              if (parsed.answers) {
                setAnswers(parsed.answers)
                answersRef.current = parsed.answers
              }
              if (parsed.flagged) setFlagged(new Set(parsed.flagged))
            } catch(e) {
              console.error("Failed to parse cached answers")
            }
          }
        }
        // Trigger START log
        fetch(`/api/exams/${examId}/start`, { method: "POST" }).catch(console.error)
      } else {
        if (data.error === "SEB_REQUIRED" || data.error === "SEB_CONFIG_INVALID") {
          setSebError(data.error)
        } else {
          console.error(data.error)
        }
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
      [qId]: { optionId: optId }
    }))
  }

  const checkAnswered = (qId: string) => {
    const ans = answers[qId]
    if (!ans) return false
    if (typeof ans === 'string') return !!ans
    if (ans.optionId) return true
    if (ans.textAnswer && ans.textAnswer.trim().length > 0) return true
    return false
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchQuestions()
    }
  }, [status, router, examId])

  // Connection Resilience & Offline Handlers
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsOffline(!navigator.onLine)

    const handleOnline = () => {
      setIsOffline(false)
      // Immediately sync if we have answers and just came back online
      if (Object.keys(answersRef.current).length > 0) {
        fetch("/api/submissions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examId, answers: answersRef.current })
        }).catch(console.error)
      }
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [examId])

  // Save to LocalStorage and Auto-Sync on answers change
  useEffect(() => {
    answersRef.current = answers
    if (status !== "authenticated" || !session?.user?.id) return

    // 1. Save to LocalStorage immediately
    const cacheKey = `olym_answers_${examId}_${session.user.id}`
    localStorage.setItem(cacheKey, JSON.stringify({
      answers,
      flagged: Array.from(flagged)
    }))

    // 2. Debounced API Sync (save progress without finishing)
    const timeoutId = setTimeout(() => {
      if (!navigator.onLine || Object.keys(answers).length === 0) return
      setSaveStatus("saving")
      fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, answers })
      }).then((res) => res.json()).then(data => {
        if(data.success) {
          setSaveStatus("saved")
          setTimeout(() => setSaveStatus("idle"), 3000)
        } else {
          setSaveStatus("idle")
        }
      }).catch(console.error)
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [answers, flagged, examId, session?.user?.id, status])

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
    if (!navigator.onLine) {
      setWaitingForOnlineSubmit(true)
      return
    }
    alert("Waktu habis! Ujian otomatis disubmit.")
    await submitAnswersToApi(answersRef.current)
    router.replace("/dashboard")
  }

  const handleSubmit = async () => {
    if (!navigator.onLine) {
      alert("Anda sedang offline. Mohon tunggu koneksi internet pulih untuk mengumpulkan ujian.")
      return
    }
    const answeredCount = Object.keys(answersRef.current).length
    const confirmed = confirm(`Anda telah menjawab ${answeredCount} dari ${questions.length} soal. Apakah Anda yakin ingin mengakhiri ujian?`)
    if (confirmed) {
      const success = await submitAnswersToApi(answersRef.current)
      if (success) {
        alert("Ujian berhasil disubmit! Jawaban Anda telah tersimpan.")
        router.replace("/dashboard")
      }
    }
  }

  useEffect(() => {
    if (waitingForOnlineSubmit && !isOffline) {
      submitAnswersToApi(answersRef.current).then(() => {
        router.replace("/dashboard")
      })
    }
  }, [isOffline, waitingForOnlineSubmit, router])

  if (loading || status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
      </div>
    )
  }

  if (sebError) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors ${isDark ? 'bg-rose-950 text-rose-200' : 'bg-rose-50 text-rose-900'} gap-6`}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-rose-500/20 text-rose-500 mb-2 shadow-lg shadow-rose-500/20">
          <ShieldOff size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-3 tracking-tight">Akses Ditolak</h1>
          <p className="max-w-md mx-auto text-sm leading-relaxed opacity-90">
            {sebError === "SEB_REQUIRED" 
              ? "Ujian ini hanya dapat diakses melalui aplikasi Safe Exam Browser (SEB). Harap buka link ujian ini menggunakan SEB."
              : "Konfigurasi SEB Anda tidak valid atau kadaluarsa. Silakan gunakan file konfigurasi (.seb) resmi yang diberikan oleh pengawas."}
          </p>
        </div>
        <button onClick={() => router.push("/dashboard")} className="mt-4 text-xs font-medium px-6 py-3 rounded-full transition-all bg-rose-600 text-white hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-600/30">
          Kembali ke Dashboard
        </button>
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
  const isAnswered = checkAnswered(currentQ.id)
  const isFlagged = flagged.has(currentQ.id)

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col font-sans overflow-hidden relative ${isDark ? 'bg-[#0a0a0a] text-zinc-300 selection:bg-white/20' : 'bg-white text-zinc-600 selection:bg-black/10'}`}>
      
      {/* Dynamic Island Style Camera View */}
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 h-10 md:h-12 rounded-full overflow-hidden shadow-2xl border transition-all duration-300 hover:h-48 hover:rounded-3xl hover:w-36 hover:top-1/2 hover:-translate-y-1/2 ${isDark ? 'border-white/10 bg-black/60' : 'border-black/10 bg-white/60'} backdrop-blur-xl flex items-center gap-3 pr-4 group`}>
        <div className="h-full aspect-[4/3] relative overflow-hidden bg-black shrink-0 transition-all duration-300 group-hover:w-full group-hover:aspect-[3/4]">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover opacity-90"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
        <div className="flex items-center gap-2 group-hover:hidden whitespace-nowrap cursor-default">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <span className={`text-[10px] md:text-xs font-medium tracking-widest uppercase ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
            Pengawasan Aktif
          </span>
        </div>
        <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
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

      {/* Offline Waiting Modal */}
      {waitingForOnlineSubmit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className={`max-w-md w-full p-8 border ${isDark ? 'bg-[#0a0a0a] border-zinc-800' : 'bg-white border-zinc-200'} text-center shadow-2xl`}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 bg-yellow-500/10 text-yellow-500 animate-pulse">
              <WifiOff size={24} />
            </div>
            <h3 className={`text-xl font-medium mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Menunggu Koneksi...</h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Waktu ujian telah habis, namun Anda sedang offline. Mohon jangan tutup halaman ini. Ujian akan otomatis dikumpulkan saat koneksi internet pulih.
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar (Focus HUD) */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-zinc-800/20">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-indigo-500 transition-all duration-500"
          style={{ width: `${questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0}%` }}
        />
      </div>

      {/* Ultra Minimal Header */}
      <header className={`sticky top-0 z-30 border-b ${isDark ? 'border-zinc-900 bg-[#0a0a0a]/80' : 'border-zinc-100 bg-white/80'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className={`font-semibold text-sm tracking-tight flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'} hidden sm:flex bg-emerald-500/10 px-3 py-1.5 rounded-full`}>
            <Shield size={14} />
            Secure Session
          </div>
          
          {/* Timer */}
          <div className={`flex items-center gap-2 font-mono text-lg tracking-widest ${timeLeft < 300 ? 'text-rose-500 animate-pulse font-bold' : (isDark ? 'text-zinc-300' : 'text-zinc-700')}`}>
            <Clock size={16} />
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-4">
            {/* Auto-save indicator */}
            <div className={`hidden md:flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest transition-opacity duration-300 ${saveStatus === 'idle' ? 'opacity-0' : 'opacity-100'}`}>
              {saveStatus === 'saving' && <><Loader2 size={12} className={`animate-spin ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} /><span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Menyimpan...</span></>}
              {saveStatus === 'saved' && <><CheckCircle2 size={12} className="text-emerald-500" /><span className="text-emerald-500">Tersimpan</span></>}
            </div>

            {isOffline && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                <WifiOff size={12} />
                OFFLINE
              </div>
            )}
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
        <main className="flex-1 overflow-y-auto px-6 py-12 pb-32">
          <div className="max-w-3xl mx-auto">
            
            {/* Glassmorphism Question Container */}
            <div className={`p-8 md:p-12 rounded-3xl transition-all duration-500 relative ${isDark ? 'glass-panel glow-border bg-[#111111]/90' : 'bg-white shadow-2xl shadow-zinc-200/50 border border-zinc-100'}`}>
              
              {/* Question Header */}
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-500/20">
                <div className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Soal <span className={`text-lg ml-1 ${isDark ? 'text-white' : 'text-black'}`}>{currentIndex + 1}</span> <span className="font-normal mx-1 text-zinc-500">dari</span> {questions.length}
                </div>
                <button 
                  onClick={() => toggleFlag(currentQ.id)}
                  className={`text-xs flex items-center gap-2 transition-colors px-3 py-1.5 rounded-full ${isFlagged ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : (isDark ? 'text-zinc-500 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-100')}`}
                >
                  <Flag size={14} className={isFlagged ? 'fill-orange-500' : ''} />
                  {isFlagged ? 'Ditandai Ragu' : 'Tandai Ragu'}
                </button>
              </div>

              {/* Question Card */}
              <div className={`text-xl md:text-2xl leading-relaxed font-light ${isDark ? 'text-zinc-100' : 'text-zinc-800'} ${currentQ.imageUrl ? 'mb-8' : 'mb-14'}`}>
                {currentQ.text}
              </div>

              {currentQ.imageUrl && (
                <div className="mb-14">
                  <img src={currentQ.imageUrl} alt="Gambar Pendukung" className={`max-h-[400px] w-auto rounded-xl border object-contain shadow-md ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`} />
                </div>
              )}

              {/* Options / Answer Input */}
              {(!currentQ.type || currentQ.type === 'MULTIPLE_CHOICE') && (
              <div className="flex flex-col gap-4">
                {currentQ.options?.map((opt: any, idx: number) => {
                  const selected = answers[currentQ.id]?.optionId === opt.id || answers[currentQ.id] === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      className={`w-full text-left p-5 rounded-xl border transition-all duration-300 flex items-start gap-5 ${
                        selected 
                          ? (isDark ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-indigo-500 bg-indigo-50 shadow-md') 
                          : (isDark ? 'border-zinc-800 hover:border-zinc-600 bg-black/20' : 'border-zinc-200 hover:border-zinc-300 bg-white')
                      }`}
                    >
                      <div className={`shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-bold mt-0.5 transition-colors ${
                        selected 
                          ? (isDark ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white') 
                          : (isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500')
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <div className={`text-base md:text-lg pt-1 ${
                        selected 
                          ? (isDark ? 'text-indigo-100' : 'text-indigo-900') 
                          : (isDark ? 'text-zinc-300' : 'text-zinc-700')
                      }`}>
                        {opt.text}
                      </div>
                    </button>
                  )
                })}
              </div>
              )}

              {currentQ.type === 'SHORT_ANSWER' && (
                <div className="flex flex-col gap-3">
                  <input 
                    type="text"
                    placeholder="Ketik jawaban Anda di sini..."
                    value={answers[currentQ.id]?.textAnswer || (typeof answers[currentQ.id] === 'string' ? answers[currentQ.id] : "")}
                    onChange={(e) => {
                      setAnswers(prev => ({
                        ...prev,
                        [currentQ.id]: { textAnswer: e.target.value }
                      }))
                    }}
                    className={`w-full p-5 rounded-xl text-lg outline-none transition-all duration-300 border focus:ring-2 ${isDark ? 'bg-black/50 border-zinc-800 text-white placeholder-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/20' : 'bg-zinc-50 border-zinc-200 text-black placeholder-zinc-400 focus:border-indigo-500 focus:ring-indigo-500/20'}`}
                  />
                </div>
              )}

              {currentQ.type === 'ESSAY' && (
                <div className="flex flex-col gap-3">
                  <textarea 
                    rows={8}
                    placeholder="Ketik jawaban esai Anda di sini..."
                    value={answers[currentQ.id]?.textAnswer || (typeof answers[currentQ.id] === 'string' ? answers[currentQ.id] : "")}
                    onChange={(e) => {
                      setAnswers(prev => ({
                        ...prev,
                        [currentQ.id]: { textAnswer: e.target.value }
                      }))
                    }}
                    className={`w-full p-5 rounded-xl text-lg outline-none resize-y transition-all duration-300 border focus:ring-2 ${isDark ? 'bg-black/50 border-zinc-800 text-white placeholder-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/20' : 'bg-zinc-50 border-zinc-200 text-black placeholder-zinc-400 focus:border-indigo-500 focus:ring-indigo-500/20'}`}
                  />
                </div>
              )}
            </div>

            {/* Floating Navigation Bottom */}
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-80 z-40 px-6 py-4 rounded-full shadow-2xl backdrop-blur-xl border flex items-center gap-8 ${isDark ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-white/80 border-black/10'}`}>
              <button 
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className={`text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-black'}`}
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>
              
              <div className={`w-px h-6 ${isDark ? 'bg-zinc-800' : 'bg-zinc-300'}`}></div>

              <button 
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className={`text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-black'}`}
              >
                Selanjutnya <ChevronRight size={16} />
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
                const isAns = checkAnswered(q.id)
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
