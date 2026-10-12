"use client"

import { useState } from "react"
import { ShieldCheck, X } from "lucide-react"
import { isDemoMode } from "@/lib/demo"

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (!isDemoMode() || dismissed) {
    return null
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
        onClick={() => setDismissed(true)}
        aria-label="Tutup indikator mode demo"
        className="ml-1 p-0.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  )
}
