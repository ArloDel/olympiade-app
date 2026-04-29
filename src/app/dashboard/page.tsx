"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LogOut, Camera, Shield, Award, Moon, Sun, Monitor, AlertTriangle } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [cameraPermission, setCameraPermission] = useState<"pending" | "granted" | "denied">("pending")
  const [checkingCamera, setCheckingCamera] = useState(false)
  const [exam, setExam] = useState<any>(null)
  const [examLoading, setExamLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchLatestExam()
    }
  }, [status, router])

  const fetchLatestExam = async () => {
    try {
      const res = await fetch("/api/exams")
      const data = await res.json()
      if (data.success && data.data.length > 0) {
        const latestExam = data.data[0]

        setExam({
          ...latestExam,
          totalQuestions: latestExam._count?.questions || 0
        })

        if (latestExam.isFinished) {
          fetchResult(latestExam.id)
        }
      }
    } catch (err) {
      console.error("Failed to fetch exams:", err)
    } finally {
      setExamLoading(false)
    }
  }

  const fetchResult = async (examId: string) => {
    try {
      const res = await fetch(`/api/results?examId=${examId}`)
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch results:", err)
    }
  }

  const checkCamera = async () => {
    setCheckingCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (stream) {
        setCameraPermission("granted")
        stream.getTracks().forEach(track => track.stop())
      }
    } catch (err) {
      setCameraPermission("denied")
    } finally {
      setCheckingCamera(false)
    }
  }

  const handleReset = async () => {
    if (!confirm("DEV ONLY: Reset semua jawaban dan sesi untuk ujian ini?")) return;

    setExamLoading(true);
    try {
      const res = await fetch("/api/test/reset-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: exam.id })
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert("Gagal mereset: " + data.error);
        setExamLoading(false);
      }
    } catch (err) {
      console.error(err);
      setExamLoading(false);
    }
  };

  const isDark = theme === "dark"

  if (status === "loading" || examLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col font-sans ${isDark ? 'bg-[#0a0a0a] text-zinc-300 selection:bg-white/20' : 'bg-white text-zinc-600 selection:bg-black/10'}`}>

      {/* Ultra Minimal Header */}
      <header className={`sticky top-0 z-30 border-b ${isDark ? 'border-zinc-900 bg-[#0a0a0a]/80' : 'border-zinc-100 bg-white/80'} backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className={`font-semibold text-sm tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
            <Shield size={16} />
            OlymApp
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`text-xs flex items-center gap-1.5 transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? 'Light' : 'Dark'}
            </button>

            <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {session.user.name}
            </div>

            <button
              onClick={() => signOut()}
              className={`transition-colors ${isDark ? 'text-zinc-600 hover:text-white' : 'text-zinc-300 hover:text-black'}`}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - No Cards, Flat Minimalist Layout */}
      <main className="flex-1 px-6 py-12 md:py-20 flex flex-col items-center">
        <div className="max-w-2xl w-full">

          {exam ? (
            exam.isFinished && result ? (
              <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">

                <div className="mb-12">
                  <h2 className={`text-2xl font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Evaluasi Selesai</h2>
                  <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Anda telah menyelesaikan modul {exam.title}. Berikut adalah rekapitulasi penilaian.
                  </p>
                </div>

                <div className="flex flex-col gap-10">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Skor Akhir</span>
                    <span className={`text-8xl font-light tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>
                      {result.score}
                    </span>
                  </div>

                  <div className={`grid grid-cols-3 gap-8 py-8 border-t ${isDark ? 'border-zinc-900' : 'border-zinc-100'}`}>
                    <div className="flex flex-col">
                      <span className={`text-3xl font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{result.correctAnswers}</span>
                      <span className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Benar</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-3xl font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{result.wrongAnswers}</span>
                      <span className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Salah</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-3xl font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{result.unanswered}</span>
                      <span className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Kosong</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">

                <div className="mb-12">
                  <div className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-6 ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-emerald-500' : 'bg-emerald-500'}`}></span>
                    Sesi Aktif
                  </div>

                  <h1 className={`text-3xl font-medium tracking-tight mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    {exam.title}
                  </h1>
                  <p className={`text-sm leading-relaxed max-w-lg ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Anda terdaftar pada modul ini. Pastikan Anda membaca tata tertib dan melakukan verifikasi perangkat sebelum memulai.
                  </p>
                </div>

                {/* Minimal List for Details */}
                <div className={`flex flex-col gap-4 py-8 border-y ${isDark ? 'border-zinc-900' : 'border-zinc-100'} mb-12`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Durasi Pengerjaan</span>
                    <span className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{exam.duration} Menit</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Total Soal</span>
                    <span className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{exam.totalQuestions} Butir</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Waktu Mulai</span>
                    <span className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{new Date(exam.startTime).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Minimal Device Check */}
                <div className="mb-12 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Camera size={16} className={isDark ? 'text-zinc-600' : 'text-zinc-400'} />
                      <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Status Kamera</span>
                    </div>
                    <span className={`text-xs font-medium ${cameraPermission === 'granted' ? 'text-emerald-500' : cameraPermission === 'denied' ? 'text-rose-500' : isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {cameraPermission === 'granted' && "Terhubung"}
                      {cameraPermission === 'denied' && "Akses Ditolak"}
                      {cameraPermission === 'pending' && "Belum Diverifikasi"}
                    </span>
                  </div>

                  {cameraPermission === 'pending' && (
                    <button
                      onClick={checkCamera}
                      disabled={checkingCamera}
                      className={`text-xs font-medium py-2 px-4 rounded self-start transition-colors ${isDark ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-zinc-100 text-black hover:bg-zinc-200'}`}
                    >
                      {checkingCamera ? "Memeriksa..." : "Izinkan Kamera"}
                    </button>
                  )}

                  {cameraPermission === 'denied' && (
                    <p className="text-[11px] text-rose-500">Kamera wajib diizinkan di pengaturan browser Anda.</p>
                  )}
                </div>

                {/* Action */}
                <div className="flex flex-col gap-3">
                  <button
                    disabled={cameraPermission !== 'granted' || !exam}
                    onClick={() => exam && router.push(`/exam/${exam.id}`)}
                    className={`w-full py-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${isDark
                        ? 'bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600'
                        : 'bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400'
                      }`}
                  >
                    Mulai Evaluasi
                  </button>
                  {cameraPermission !== 'granted' && (
                    <p className={`text-[11px] text-center ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      Selesaikan verifikasi sistem sebelum melanjutkan.
                    </p>
                  )}
                </div>

              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Monitor size={24} className={`mb-4 ${isDark ? 'text-zinc-800' : 'text-zinc-200'}`} />
              <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Tidak ada ujian yang dijadwalkan.</p>
            </div>
          )}
        </div>
      </main>

      {/* DEV ONLY Reset Button */}
      {process.env.NODE_ENV === "development" && exam && (
        <button
          onClick={handleReset}
          className={`fixed bottom-6 right-6 px-4 py-2 rounded-full shadow-xl text-xs font-medium z-50 flex items-center gap-2 transition-transform hover:scale-105 ${isDark ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'}`}
        >
          <AlertTriangle size={14} /> DEV: Reset Progress
        </button>
      )}
    </div>
  )
}
