"use client"

import { SessionProvider } from "next-auth/react"
import { CommandPalette } from "@/components/CommandPalette"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CommandPalette />
    </SessionProvider>
  )
}
