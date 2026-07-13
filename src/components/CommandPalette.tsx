"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Search, FileText, User, X } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"

export function CommandPalette() {
  const { data: session } = useSession()
  const router = useRouter()
  const [theme] = useTheme()
  const isDark = theme === "dark"

  const role = (session?.user as any)?.role
  const isAuthorized = role === "ADMIN" || role === "SUPERADMIN"

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ exams: any[], students: any[] }>({ exams: [], students: [] })
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  // Toggle with Ctrl+K or Cmd+K
  useEffect(() => {
    if (!isAuthorized) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isAuthorized])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setQuery("")
      setResults({ exams: [], students: [] })
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Search API
  useEffect(() => {
    if (!isOpen) return

    const fetchSearch = async () => {
      if (query.trim().length < 2) {
        setResults({ exams: [], students: [] })
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.success) {
          setResults(data.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
        setSelectedIndex(0)
      }
    }

    const timer = setTimeout(fetchSearch, 300)
    return () => clearTimeout(timer)
  }, [query, isOpen])

  const flattenedResults = [
    ...results.exams.map(e => ({ ...e, type: "exam" })),
    ...results.students.map(s => ({ ...s, type: "student" }))
  ]

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % (flattenedResults.length || 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + (flattenedResults.length || 1)) % (flattenedResults.length || 1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (flattenedResults.length > 0) {
          handleSelect(flattenedResults[selectedIndex])
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, flattenedResults, selectedIndex])

  const handleSelect = (item: any) => {
    setIsOpen(false)
    if (item.type === "exam") {
      router.push(`/admin/results?examId=${item.id}`)
    } else if (item.type === "student") {
      router.push(`/admin/results?search=${encodeURIComponent(item.name)}`)
    }
  }

  if (!isAuthorized || !isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
      
      <div className={`relative w-full max-w-xl flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'glass-panel glow-border' : 'bg-white border border-zinc-200'}`}>
        
        {/* Search Input */}
        <div className={`flex items-center px-4 py-3 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <Search size={18} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none px-3 text-base placeholder-zinc-500"
            placeholder="Cari murid atau ujian..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={() => setIsOpen(false)}
            className={`p-1 rounded transition-colors ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:text-black hover:bg-zinc-100'}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex justify-center p-8">
              <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
            </div>
          )}

          {!loading && query.length > 0 && query.length < 2 && (
             <div className={`p-8 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
               Ketik minimal 2 karakter...
             </div>
          )}

          {!loading && query.length >= 2 && flattenedResults.length === 0 && (
             <div className={`p-8 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
               Tidak ada hasil yang cocok.
             </div>
          )}

          {!loading && flattenedResults.length > 0 && (
            <div className="p-2 space-y-4">
              
              {results.exams.length > 0 && (
                <div>
                  <div className={`px-2 py-1.5 text-xs font-medium uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Ujian
                  </div>
                  {results.exams.map((exam) => {
                    const globalIndex = flattenedResults.findIndex(r => r.id === exam.id && r.type === "exam")
                    const isSelected = selectedIndex === globalIndex
                    return (
                      <button
                        key={exam.id}
                        onClick={() => handleSelect({ ...exam, type: "exam" })}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected 
                            ? isDark ? 'bg-white/10 text-white' : 'bg-zinc-100 text-black'
                            : isDark ? 'text-zinc-300 hover:bg-white/5' : 'text-zinc-600 hover:bg-zinc-50'
                        }`}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <FileText size={16} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                        <span className="flex-1 truncate text-sm font-medium">{exam.title}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {results.students.length > 0 && (
                <div>
                  <div className={`px-2 py-1.5 text-xs font-medium uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Murid
                  </div>
                  {results.students.map((student) => {
                    const globalIndex = flattenedResults.findIndex(r => r.id === student.id && r.type === "student")
                    const isSelected = selectedIndex === globalIndex
                    return (
                      <button
                        key={student.id}
                        onClick={() => handleSelect({ ...student, type: "student" })}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected 
                            ? isDark ? 'bg-white/10 text-white' : 'bg-zinc-100 text-black'
                            : isDark ? 'text-zinc-300 hover:bg-white/5' : 'text-zinc-600 hover:bg-zinc-50'
                        }`}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <User size={16} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                          <span className="truncate text-sm font-medium">{student.name}</span>
                        </div>
                        <span className={`text-[10px] truncate ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {student.email}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-4 py-2 border-t flex justify-between items-center text-[10px] ${isDark ? 'border-zinc-800 text-zinc-500 bg-black/20' : 'border-zinc-100 text-zinc-400 bg-zinc-50'}`}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className={`px-1 py-0.5 rounded border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>↑</kbd><kbd className={`px-1 py-0.5 rounded border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>↓</kbd> Navigasi</span>
            <span className="flex items-center gap-1"><kbd className={`px-1 py-0.5 rounded border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>Enter</kbd> Pilih</span>
            <span className="flex items-center gap-1"><kbd className={`px-1 py-0.5 rounded border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>Esc</kbd> Tutup</span>
          </div>
        </div>

      </div>
    </div>
  )
}
