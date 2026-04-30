"use client"

import { signIn, getSession } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Moon, Sun, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const res = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError(res.error)
      setIsLoading(false)
    } else {
      const session = await getSession()
      if (session?.user?.role === "ADMIN") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
      router.refresh()
    }
  }

  const isDark = theme === "dark"

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

          <div className={`mt-10 text-center text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Mengalami kendala? Silakan hubungi proktor ujian Anda.
          </div>
        </div>

      </main>
    </div>
  )
}
