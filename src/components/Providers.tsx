"use client"

import { SessionProvider } from "next-auth/react"
import { CommandPalette } from "@/components/CommandPalette"
import { DemoBanner } from "@/components/DemoBanner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CommandPalette />
      <DemoBanner />
    </SessionProvider>
  )
}
