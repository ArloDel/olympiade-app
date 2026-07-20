"use client"

import { useEffect, useState } from "react"
import { ShieldAlert, Clock, User, Activity, FileText } from "lucide-react"
import { useTheme } from "@/hooks/useTheme";

export default function SuperadminLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [theme] = useTheme()

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/superadmin/logs")
      const data = await res.json()
      if (data.success) {
        setLogs(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err)
    } finally {
      setLoading(false)
    }
  }

  const isDark = theme === "dark"

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d)
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ')
  }

  const formatDetails = (details: string) => {
    if (!details) return "-"
    try {
      const parsed = JSON.parse(details)
      return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ')
    } catch {
      return details
    }
  }

  if (loading) {
     return (
       <div className={`min-h-[60vh] flex items-center justify-center`}>
         <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isDark ? 'border-zinc-600 border-t-white' : 'border-zinc-300 border-t-black'}`}></div>
       </div>
     )
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-amber-500' : 'bg-amber-600'} animate-pulse`}></span>
              Audit Trails
            </div>
            <h1 className={`text-3xl font-medium tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Log Aktivitas Sistem</h1>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Pantau seluruh tindakan penting yang dilakukan oleh administrator.</p>
          </div>
        </div>

        <div className="flex flex-col">
          <div className={`grid grid-cols-12 gap-4 pb-4 text-xs font-medium uppercase tracking-widest border-b ${isDark ? 'text-zinc-600 border-zinc-900' : 'text-zinc-400 border-zinc-100'}`}>
            <div className="col-span-3 md:col-span-2 flex items-center gap-2"><Clock size={12}/> Waktu</div>
            <div className="col-span-3 md:col-span-3 flex items-center gap-2"><User size={12}/> Pengguna</div>
            <div className="col-span-3 md:col-span-3 flex items-center gap-2"><Activity size={12}/> Aksi</div>
            <div className="col-span-3 md:col-span-4 flex items-center gap-2"><FileText size={12}/> Detail</div>
          </div>
          
          <div className="flex flex-col pt-4">
            {logs.length === 0 ? (
              <div className={`py-12 text-center text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Belum ada log aktivitas.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`grid grid-cols-12 gap-4 py-4 border-b ${isDark ? 'border-zinc-900 hover:bg-zinc-900/50' : 'border-zinc-50 hover:bg-zinc-50'} items-center transition-colors`}>
                  <div className={`col-span-3 md:col-span-2 text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {formatDate(log.createdAt)}
                  </div>
                  
                  <div className="col-span-3 md:col-span-3 flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded bg-gradient-to-br ${isDark ? 'from-zinc-800 to-zinc-900' : 'from-zinc-100 to-zinc-200'} flex items-center justify-center shrink-0`}>
                      <User size={14} className={isDark ? 'text-zinc-500' : 'text-zinc-400'}/>
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-medium truncate ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                        {log.user?.name || 'Unknown'}
                      </div>
                      <div className={`text-xs truncate ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                        {log.user?.email || '-'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-3 md:col-span-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${
                      log.action.includes('DELETE') ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600') :
                      log.action.includes('CREATE') ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') :
                      (isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600')
                    }`}>
                      {formatAction(log.action)}
                    </span>
                  </div>

                  <div className={`col-span-3 md:col-span-4 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'} truncate`}>
                    {formatDetails(log.details)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
    </div>
  )
}
