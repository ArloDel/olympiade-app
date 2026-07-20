"use client"

import { useEffect, useState } from "react"
import { Users, ShieldCheck, Lock, ShieldAlert, Activity, Trash2, Plus, X } from "lucide-react"
import { useTheme } from "@/hooks/useTheme";

export default function SuperadminAdminsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [theme] = useTheme()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newAdminName, setNewAdminName] = useState("")
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/superadmin/users")
      const data = await res.json()
      if (data.success) {
        setAdmins(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err)
    } finally {
      setLoading(false)
    }
  }

  const toggleLock = async (userId: string, currentLockStatus: boolean) => {
    try {
      const newStatus = !currentLockStatus
      const res = await fetch(`/api/superadmin/users/${userId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLocked: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        setAdmins(prev => prev.map(a => 
          a.id === userId 
            ? { ...a, isLocked: data.data.isLocked } 
            : a
        ))
      } else {
        alert("Gagal mengubah status lock: " + data.error)
      }
    } catch (err) {
      console.error("Error toggling lock:", err)
      alert("Terjadi kesalahan sistem")
    }
  }

  const deleteAdmin = async (userId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus admin ini?")) return;
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        setAdmins(prev => prev.filter(a => a.id !== userId))
      } else {
        alert("Gagal menghapus admin: " + data.error)
      }
    } catch (err) {
      console.error("Error deleting admin:", err)
      alert("Terjadi kesalahan sistem")
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/superadmin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAdminName, email: newAdminEmail })
      })
      const data = await res.json()
      if (data.success) {
        setAdmins(prev => [...prev, data.data])
        setIsAddModalOpen(false)
        setNewAdminName("")
        setNewAdminEmail("")
      } else {
        alert("Gagal menambah admin: " + data.error)
      }
    } catch (err) {
      console.error("Error adding admin:", err)
      alert("Terjadi kesalahan sistem")
    } finally {
      setAddLoading(false)
    }
  }

  const filteredAdmins = admins.filter(a => 
    (a.name && a.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (a.email && a.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const totalAdmins = admins.length;
  const lockedAdmins = admins.filter(a => a.isLocked).length;

  const isDark = theme === "dark"

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
              Superadmin Area
            </div>
            <h1 className={`text-3xl font-medium tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Kelola Admin</h1>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Tambah, hapus, atau kunci akses Admin.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors w-full md:w-auto ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
            >
              <Plus size={16} /> Tambah Admin
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-2 gap-8 py-8 mb-12 border-y ${isDark ? 'border-zinc-900' : 'border-zinc-100'}`}>
          <div className="flex flex-col">
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'} mb-2 flex items-center gap-2`}><Users size={14}/> Total Admin</span>
            <span className={`text-3xl font-medium ${isDark ? 'text-white' : 'text-black'}`}>{totalAdmins}</span>
          </div>
          <div className="flex flex-col">
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'} mb-2 flex items-center gap-2`}><Lock size={14}/> Terkunci</span>
            <span className={`text-3xl font-medium ${isDark ? 'text-white' : 'text-black'}`}>{lockedAdmins}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <div className={`grid grid-cols-12 gap-4 pb-4 text-xs font-medium uppercase tracking-widest border-b ${isDark ? 'text-zinc-600 border-zinc-900' : 'text-zinc-400 border-zinc-100'}`}>
            <div className="col-span-6 md:col-span-5">Admin</div>
            <div className="col-span-3 md:col-span-4">Status</div>
            <div className="col-span-3 md:col-span-3 text-right">Tindakan</div>
          </div>

          {filteredAdmins.map(a => (
            <div key={a.id} className={`grid grid-cols-12 gap-4 py-4 items-center border-b transition-colors ${isDark ? 'border-zinc-900 hover:bg-zinc-900/30' : 'border-zinc-50 hover:bg-zinc-50'}`}>
              
              <div className="col-span-6 md:col-span-5 flex flex-col pr-2">
                <span className={`text-sm font-medium truncate ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{a.name}</span>
                <span className={`text-xs truncate ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{a.email}</span>
              </div>

              <div className="col-span-3 md:col-span-4 flex items-center">
                <span className={`text-xs font-medium capitalize flex items-center gap-2 ${a.isLocked ? (isDark ? 'text-rose-500' : 'text-rose-600') : (isDark ? 'text-emerald-500' : 'text-emerald-600')}`}>
                  {a.isLocked ? "Terkunci" : "Aktif"}
                </span>
              </div>

              <div className="col-span-3 md:col-span-3 flex justify-end gap-2">
                <button 
                  onClick={() => toggleLock(a.id, a.isLocked)}
                  className={`text-xs font-medium px-4 py-2 rounded transition-colors ${
                    a.isLocked 
                      ? isDark ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-zinc-200 text-black hover:bg-zinc-300"
                      : isDark ? "border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600" : "border border-zinc-200 text-zinc-500 hover:text-black hover:border-zinc-400"
                  }`}
                >
                  {a.isLocked ? "Buka" : "Kunci"}
                </button>
                <button 
                  onClick={() => deleteAdmin(a.id)}
                  className={`text-xs font-medium px-3 py-2 rounded transition-colors ${isDark ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" : "bg-rose-50 text-rose-600 hover:bg-rose-100"}`}
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          
          {filteredAdmins.length === 0 && (
            <div className={`py-12 text-center text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Belum ada admin yang terdaftar.
            </div>
          )}
        </div>

      {/* Add Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className={`relative w-full max-w-md flex flex-col rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'glass-panel glow-border' : 'bg-white border border-zinc-200'}`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
              <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-black'}`}>Tambah Admin Baru</h2>
              <button onClick={() => setIsAddModalOpen(false)} className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Nama Admin</label>
                <input 
                  type="text" 
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className={`w-full px-4 py-2.5 text-sm rounded-lg outline-none transition-colors border ${isDark ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:border-white' : 'bg-zinc-50 border-zinc-200 text-black placeholder-zinc-400 focus:border-black'}`}
                  placeholder="Masukkan nama"
                  required
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Email Admin</label>
                <input 
                  type="email" 
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className={`w-full px-4 py-2.5 text-sm rounded-lg outline-none transition-colors border ${isDark ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:border-white' : 'bg-zinc-50 border-zinc-200 text-black placeholder-zinc-400 focus:border-black'}`}
                  placeholder="Masukkan email/username"
                  required
                />
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Password default: password123 (Sesuai dengan pengaturan aplikasi).
              </p>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors border ${isDark ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={addLoading}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors flex justify-center items-center ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'} disabled:opacity-50`}
                >
                  {addLoading ? (
                    <div className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? 'border-black/20 border-t-black' : 'border-white/20 border-t-white'}`}></div>
                  ) : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
