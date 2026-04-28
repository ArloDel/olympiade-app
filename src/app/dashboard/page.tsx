"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LogOut, Camera, CheckCircle, AlertTriangle } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [cameraPermission, setCameraPermission] = useState<"pending" | "granted" | "denied">("pending")
  const [checkingCamera, setCheckingCamera] = useState(false)
  const [exam, setExam] = useState<any>(null)
  const [examLoading, setExamLoading] = useState(true)

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
      }
    } catch (err) {
      console.error("Failed to fetch exams:", err)
    } finally {
      setExamLoading(false)
    }
  }

  const checkCamera = async () => {
    setCheckingCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (stream) {
        setCameraPermission("granted")
        // Stop all tracks to not keep the light on
        stream.getTracks().forEach(track => track.stop())
      }
    } catch (err) {
      setCameraPermission("denied")
    } finally {
      setCheckingCamera(false)
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) return null

  if (examLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="text-slate-500">Memuat data ujian...</div></div>
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl text-blue-600 dark:text-blue-400">Olym-App</div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-500">Halo,</span> <span className="font-medium">{session.user.name || "Peserta"}</span>
            </div>
            <button 
              onClick={() => signOut()}
              className="p-2 text-slate-500 hover:text-red-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 grid md:grid-cols-3 gap-6">
        {/* Left Column - Exam Info */}
        <div className="md:col-span-2 space-y-6">
          {exam ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-2xl font-bold mb-2">{exam.title}</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Pastikan Anda membaca seluruh instruksi sebelum memulai ujian.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Durasi</div>
                  <div className="font-medium text-lg">{exam.duration} Menit</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Soal</div>
                  <div className="font-medium text-lg">{exam.totalQuestions} Butir</div>
                </div>
                <div className="col-span-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1">Jadwal Mulai</div>
                  <div className="font-medium">{new Date(exam.startTime).toLocaleString()}</div>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none text-sm">
                <h3 className="text-lg font-semibold mb-3">Instruksi Pengerjaan:</h3>
                <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
                  <li>Peserta wajib memberikan izin akses kamera selama ujian berlangsung.</li>
                  <li>Sistem akan mendeteksi jika Anda berpindah tab atau mengecilkan browser (Alt+Tab/Minimize).</li>
                  <li>Pelanggaran seperti berpindah tab akan tercatat oleh sistem. Jika Anda berpindah tab lebih dari 3 kali, ujian akan terkunci secara otomatis.</li>
                  <li>Jawaban Anda akan tersimpan secara otomatis setiap kali Anda berpindah soal.</li>
                  <li>Gunakan tombol "Ragu-ragu" (Flag) jika Anda ingin menandai soal untuk ditinjau kembali nanti.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-10 text-center">
              <div className="text-slate-500 mb-2">Belum ada ujian yang tersedia saat ini.</div>
              <div className="text-sm text-slate-400">Silakan hubungi administrator jika Anda merasa ini adalah sebuah kesalahan.</div>
            </div>
          )}
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-lg mb-4">Pengecekan Perangkat</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${cameraPermission === 'granted' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : cameraPermission === 'denied' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'}`}>
                  <Camera size={20} />
                </div>
                <div>
                  <div className="font-medium text-sm">Izin Kamera</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {cameraPermission === 'granted' && "Kamera terdeteksi dan diizinkan"}
                    {cameraPermission === 'denied' && "Akses kamera ditolak!"}
                    {cameraPermission === 'pending' && "Sistem perlu mengakses kamera Anda"}
                  </div>
                </div>
              </div>

              {cameraPermission === 'pending' && (
                <button 
                  onClick={checkCamera}
                  disabled={checkingCamera}
                  className="w-full py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors"
                >
                  {checkingCamera ? "Mengecek..." : "Cek Izin Kamera"}
                </button>
              )}
              
              {cameraPermission === 'denied' && (
                <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-100 dark:border-red-900/50">
                  <span className="font-semibold block mb-1">Akses Ditolak</span>
                  Silakan izinkan akses kamera di pengaturan browser Anda, lalu refresh halaman ini.
                </div>
              )}
            </div>

            <hr className="border-slate-200 dark:border-slate-700 mb-6" />

            <button 
              disabled={cameraPermission !== 'granted' || !exam}
              onClick={() => exam && router.push(`/exam/${exam.id}`)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-md disabled:shadow-none flex justify-center items-center gap-2"
            >
              {cameraPermission === 'granted' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              Mulai Ujian Sekarang
            </button>
            
            {cameraPermission !== 'granted' && (
              <p className="text-xs text-center text-slate-500 mt-3">
                Anda harus memberikan izin kamera sebelum bisa memulai ujian.
              </p>
            )}
            {cameraPermission === 'granted' && !exam && (
               <p className="text-xs text-center text-slate-500 mt-3">
                Ujian belum tersedia.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
