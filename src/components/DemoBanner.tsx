"use client"

import { useState } from "react"
import { RotateCcw, ShieldCheck, X } from "lucide-react"
import { isDemoMode } from "@/lib/demo"

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  if (!isDemoMode() || dismissed) {
    return null
  }

  const handleResetDemo = async () => {
    if (isResetting) return
    setIsResetting(true)
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.success) {
        try {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("olym_answers_")) {
              localStorage.removeItem(key)
            }
          })
        } catch {}
        window.location.reload()
      } else {
        alert(data.error || "Gagal mereset data demo.")
        setIsResetting(false)
      }
    } catch (error) {
      console.error("Failed to reset demo:", error)
      alert("Gagal menghubungi server untuk mereset demo.")
      setIsResetting(false)
    }
  }

  return (
    <div
      data-testid="demo-mode-banner"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-amber-500/30 bg-zinc-950/90 text-zinc-200 shadow-lg backdrop-blur-md text-xs"
    >
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
      <ShieldCheck size={14} className="text-amber-400 shrink-0" />
      <span className="font-medium tracking-tight">
        Mode Demo Portofolio <span className="hidden sm:inline text-zinc-400 font-normal">— Tindakan destruktif dibatasi</span>
      </span>
      <button
        type="button"
        data-testid="demo-reset-button"
        onClick={handleResetDemo}
        disabled={isResetting}
        className="ml-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-medium transition-colors disabled:opacity-50 cursor-pointer"
        title="Reset progres ujian demo ke awal"
      >
        <RotateCcw size={11} className={isResetting ? "animate-spin" : ""} />
        <span>{isResetting ? "Mereset..." : "Reset Demo"}</span>
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Tutup indikator mode demo"
        className="ml-0.5 p-0.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  )
}
