"use client"

import { signIn, getSession } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Moon, Sun, ArrowRight, GraduationCap, MonitorCheck, ShieldAlert } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { isDemoMode } from "@/lib/demo"

const DEMO_ACCOUNTS = [
  {
    key: "student",
    label: "Student",
    subtitle: "Coba Ujian & Kamera",
    email: "student@olym.app",
    icon: GraduationCap,
  },
  {
    key: "admin",
    label: "Admin",
    subtitle: "Live Monitoring & Soal",
    email: "admin@olym.app",
    icon: MonitorCheck,
  },
  {
    key: "superadmin",
    label: "Superadmin",
    subtitle: "System Control & Logs",
    email: "superadmin@olym.app",
    icon: ShieldAlert,
  },
] as const

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeDemoEmail, setActiveDemoEmail] = useState<string | null>(null)
  const [theme, setTheme] = useTheme()

  const performLogin = async (loginIdentifier: string, loginPassword: string) => {
    setIsLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        identifier: loginIdentifier,
        password: loginPassword,
        redirect: false,
      })

      if (res?.error) {
        setError(res.error)
        setIsLoading(false)
        setActiveDemoEmail(null)
      } else {
        const session = await getSession()
        if (session?.user?.role === "SUPERADMIN") {
          router.push("/superadmin")
        } else if (session?.user?.role === "ADMIN") {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
        router.refresh()
      }
    } catch {
      setError("Terjadi kesalahan saat mengautentikasi. Silakan coba lagi.")
      setIsLoading(false)
      setActiveDemoEmail(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setActiveDemoEmail(null)
    await performLogin(identifier, password)
  }

  const handleDemoLogin = async (demoEmail: string) => {
    if (isLoading) return
    const demoPassword = "password123"
    setIdentifier(demoEmail)
    setPassword(demoPassword)
    setActiveDemoEmail(demoEmail)
    await performLogin(demoEmail, demoPassword)
  }

  const isDark = theme === "dark"
  const showDemoAccess = isDemoMode()

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-zinc-300 selection:bg-white/20' : 'bg-white text-zinc-600 selection:bg-black/10'}`}>

      {/* Minimal Header with Toggle */}
      <header className="px-6 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className={`font-semibold text-sm tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
          <Shield size={16} />
          OlymApp
        </div>

        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`text-xs flex items-center gap-1.5 transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
          {isDark ? 'Light' : 'Dark'}
        </button>
      </header>

      {/* Main Content Centered */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 w-full max-w-md mx-auto pb-20">

        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-12 text-center md:text-left">
            <h1 className={`text-4xl font-medium tracking-tight mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
              Olimpiade Exam
            </h1>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Platform Ujian Olimpiade.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <div className="flex items-center gap-2 text-xs font-medium text-rose-500 bg-rose-500/10 p-3 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                NIM / Username
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={`w-full px-0 py-3 text-sm outline-none transition-colors border-b bg-transparent ${isDark
                  ? 'border-zinc-800 text-white placeholder-zinc-700 focus:border-white'
                  : 'border-zinc-200 text-black placeholder-zinc-400 focus:border-black'
                  }`}
                placeholder="Masukkan identifier..."
              />
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-0 py-3 text-sm outline-none transition-colors border-b bg-transparent ${isDark
                  ? 'border-zinc-800 text-white placeholder-zinc-700 focus:border-white'
                  : 'border-zinc-200 text-black placeholder-zinc-400 focus:border-black'
                  }`}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 mt-8 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${isDark
                ? 'bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600'
                : 'bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400'
                }`}
            >
              {isLoading ? "Mengautentikasi..." : (
                <>Login <ArrowRight size={16} /></>
              )}
            </button>

          </form>

          {showDemoAccess && (
            <div data-testid="demo-login-section" className="mt-8 pt-6 border-t border-dashed border-zinc-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-amber-400/90' : 'text-amber-600'}`}>
                  Quick Demo Access
                </span>
                <span className={`text-[10px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  1-Click Login
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DEMO_ACCOUNTS.map((account) => {
                  const Icon = account.icon
                  const isThisActive = isLoading && activeDemoEmail === account.email

                  return (
                    <button
                      key={account.key}
                      type="button"
                      data-testid={`demo-login-${account.key}`}
                      disabled={isLoading}
                      onClick={() => handleDemoLogin(account.email)}
                      className={`group text-left p-3 rounded border transition-all disabled:cursor-not-allowed ${isDark
                        ? isThisActive
                          ? 'border-white bg-zinc-900 text-white'
                          : 'border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-600 hover:bg-zinc-900/80 text-zinc-200 disabled:opacity-50'
                        : isThisActive
                          ? 'border-black bg-zinc-100 text-black'
                          : 'border-zinc-200 bg-zinc-50/70 hover:border-zinc-400 hover:bg-zinc-100/80 text-zinc-800 disabled:opacity-50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon
                          size={14}
                          className={isDark ? 'text-zinc-400 group-hover:text-white transition-colors' : 'text-zinc-500 group-hover:text-black transition-colors'}
                        />
                        <ArrowRight
                          size={12}
                          className={`transition-transform group-hover:translate-x-0.5 ${isDark ? 'text-zinc-600 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-700'}`}
                        />
                      </div>
                      <div className="text-xs font-semibold tracking-tight">
                        {isThisActive ? "Masuk..." : account.label}
                      </div>
                      <div className={`text-[10px] leading-tight mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                        {account.subtitle}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className={`mt-10 text-center text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Mengalami kendala? Silakan hubungi proktor ujian Anda.
          </div>
        </div>

      </main>
    </div>
  )
}

