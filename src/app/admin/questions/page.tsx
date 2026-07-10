"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { Settings, LogOut, Plus, Trash2, CheckCircle, ShieldCheck, Moon, Sun, Download, Upload, ShieldAlert } from "lucide-react"
import * as XLSX from "xlsx"

export default function QuestionsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [exams, setExams] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [questions, setQuestions] = useState<any[]>([])
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  // Bank Soal Modal states
  const [showBankModal, setShowBankModal] = useState(false)
  const [bankQuestions, setBankQuestions] = useState<any[]>([])
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<Set<string>>(new Set())
  const [isLinking, setIsLinking] = useState(false)

  // Form states
  const [loading, setLoading] = useState(false)
  const [questionText, setQuestionText] = useState("")
  const [questionType, setQuestionType] = useState<"MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY">("MULTIPLE_CHOICE")
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [points, setPoints] = useState("1")
  const [options, setOptions] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ])
  const [imageUrl, setImageUrl] = useState("")
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      fetchExams()
    }
  }, [status, router])

  useEffect(() => {
    if (selectedExamId) {
      fetchQuestions(selectedExamId)
    } else {
      setQuestions([])
    }
  }, [selectedExamId])

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams")
      const data = await res.json()
      if (data.success) {
        setExams(data.data)
        if (data.data.length > 0) {
          setSelectedExamId(data.data[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchQuestions = async (examId: string) => {
    try {
      const res = await fetch(`/api/questions?examId=${examId}`)
      const data = await res.json()
      if (data.success) {
        setQuestions(data.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const openBankModal = async () => {
    if (!selectedExamId) return alert("Pilih ujian terlebih dahulu")
    
    try {
      const res = await fetch(`/api/questions`)
      const data = await res.json()
      if (data.success) {
        // Filter out questions already in this exam
        const existingIds = new Set(questions.map(q => q.id))
        const available = data.data.filter((q: any) => !existingIds.has(q.id))
        setBankQuestions(available)
        setSelectedBankQuestions(new Set())
        setShowBankModal(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const toggleBankQuestion = (id: string) => {
    const newSet = new Set(selectedBankQuestions)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedBankQuestions(newSet)
  }

  const handleLinkQuestions = async () => {
    if (selectedBankQuestions.size === 0) return
    setIsLinking(true)
    
    try {
      const res = await fetch("/api/questions/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          questionIds: Array.from(selectedBankQuestions)
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowBankModal(false)
        fetchQuestions(selectedExamId)
      } else {
        alert("Gagal menambahkan soal: " + data.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLinking(false)
    }
  }

  const handleCreateExam = async () => {
    const title = prompt("Nama Ujian:")
    if (!title) return
    const duration = prompt("Durasi (menit):", "120") || "120"
    
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000)

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: "Created from admin panel",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration,
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchExams()
      } else {
        alert("Gagal membuat ujian")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options]
    newOptions[index].text = text
    setOptions(newOptions)
  }

  const handleSetCorrect = (index: number) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }))
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, { text: "", isCorrect: false }])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) return alert("Minimal 2 opsi jawaban")
    const newOptions = options.filter((_, i) => i !== index)
    if (options[index].isCorrect && newOptions.length > 0) {
      newOptions[0].isCorrect = true
    }
    setOptions(newOptions)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      alert("Ukuran gambar melebihi batas 5MB!")
      return
    }

    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar!")
      return
    }

    setIsUploadingImage(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setImageUrl(data.url)
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert("Gagal mengunggah gambar.")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSaveQuestion = async () => {
    if (!selectedExamId) return alert("Pilih ujian terlebih dahulu")
    if (!questionText.trim()) return alert("Teks soal tidak boleh kosong")
    if (questionType === "MULTIPLE_CHOICE" && options.some(o => !o.text.trim())) return alert("Semua opsi jawaban harus diisi")
    if (questionType === "SHORT_ANSWER" && !correctAnswer.trim()) return alert("Kunci jawaban tidak boleh kosong")
    
    setLoading(true)
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExamId,
          text: questionText,
          order: questions.length + 1,
          type: questionType,
          points: parseFloat(points) || 1,
          correctAnswer: questionType === "SHORT_ANSWER" ? correctAnswer : null,
          options: questionType === "MULTIPLE_CHOICE" ? options : [],
          imageUrl: imageUrl || null
        }),
      })
      const data = await res.json()
      if (data.success) {
        setQuestionText("")
        setCorrectAnswer("")
        setPoints("1")
        setOptions([
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ])
        setImageUrl("")
        fetchQuestions(selectedExamId)
      } else {
        alert("Gagal menyimpan soal: " + data.error)
      }
    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan sistem")
    } finally {
      setLoading(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = () => {
    const headers = ["TIPE (PG/IS/ES)", "SOAL", "POIN", "OPSI A", "OPSI B", "OPSI C", "OPSI D", "OPSI E", "KUNCI"];
    const examples = [
      ["PG", "Siapakah penemu bola lampu pijar?", 1, "Nikola Tesla", "Thomas Alva Edison", "Albert Einstein", "Isaac Newton", "", "B"],
      ["IS", "Apa singkatan dari World Health Organization?", 1, "", "", "", "", "", "WHO"],
      ["ES", "Jelaskan dampak pemanasan global!", 5, "", "", "", "", "", ""]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...examples]);
    
    ws["!cols"] = [
      { wch: 15 }, { wch: 40 }, { wch: 8 }, 
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, 
      { wch: 10 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Soal");
    XLSX.writeFile(wb, "Template_Soal_OlymApp.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExamId) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const rows = data.slice(1).filter(r => r.length > 0 && r[1]);

        if (rows.length === 0) {
          alert("File Excel kosong atau format tidak sesuai.");
          return;
        }

        let currentOrder = questions.length + 1;
        const bulkQuestions = rows.map((row) => {
          const tipeRaw = String(row[0] || "PG").toUpperCase().trim();
          let type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY" = "MULTIPLE_CHOICE";
          if (tipeRaw === "IS") type = "SHORT_ANSWER";
          if (tipeRaw === "ES") type = "ESSAY";

          const text = String(row[1] || "");
          const points = parseFloat(String(row[2])) || 1;
          
          let options: {text: string, isCorrect: boolean}[] = [];
          let correctAnswer = null;

          if (type === "MULTIPLE_CHOICE") {
            const kunciRaw = String(row[8] || "A").toUpperCase().trim();
            const optionValues = [row[3], row[4], row[5], row[6], row[7]].filter(Boolean);
            
            const correctIndex = kunciRaw.charCodeAt(0) - 65; 
            
            options = optionValues.map((optText, i) => ({
              text: String(optText),
              isCorrect: i === correctIndex
            }));
            
            if (options.length === 0) {
              options = [{ text: "Benar", isCorrect: true }, { text: "Salah", isCorrect: false }];
            }
          } else if (type === "SHORT_ANSWER") {
            correctAnswer = String(row[8] || "");
          }

          return {
            text,
            type,
            points,
            order: currentOrder++,
            options,
            correctAnswer
          };
        });

        const res = await fetch("/api/questions/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ examId: selectedExamId, questions: bulkQuestions })
        });
        
        const resData = await res.json();
        if (resData.success) {
          alert(`Berhasil mengimpor ${bulkQuestions.length} soal!`);
          fetchQuestions(selectedExamId);
        } else {
          alert("Gagal mengimpor: " + resData.error);
        }
      } catch (err) {
        console.error(err);
        alert("Gagal memproses file Excel.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const isDark = theme === "dark"

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-zinc-300 selection:bg-white/20' : 'bg-white text-zinc-600 selection:bg-black/10'}`}>
      
      {/* Ultra Minimal Header */}
      <header className={`sticky top-0 z-30 border-b ${isDark ? 'border-zinc-900 bg-[#0a0a0a]/80' : 'border-zinc-100 bg-white/80'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className={`font-semibold text-sm tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                <ShieldCheck size={14} />
              </div>
              OlymAdmin
            </div>
            <nav className="hidden md:flex gap-6 text-sm">
              <Link href="/admin" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Monitoring</Link>
              <Link href="/admin/exams" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Ujian</Link>
              <Link href="/admin/questions" className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>Soal</Link>
              <Link href="/admin/grading" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Koreksi</Link>
              <Link href="/admin/results" className={`transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-500 hover:text-black'}`}>Rekap Nilai</Link>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`text-xs flex items-center gap-1.5 transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className={`transition-colors ${isDark ? 'text-zinc-600 hover:text-white' : 'text-zinc-300 hover:text-black'}`}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className={`text-3xl font-medium tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Bank Soal</h1>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>Kelola daftar pertanyaan dan struktur ujian.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              className={`w-full md:w-64 px-4 py-2.5 text-sm outline-none transition-colors border-b appearance-none cursor-pointer ${isDark ? 'bg-transparent border-zinc-800 text-white focus:border-white' : 'bg-transparent border-zinc-200 text-black focus:border-black'}`}
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              <option value="" disabled className={isDark ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-zinc-400'}>-- Pilih Modul Ujian --</option>
              {exams.map(ex => (
                <option key={ex.id} value={ex.id} className={isDark ? 'bg-zinc-900' : 'bg-white'}>{ex.title}</option>
              ))}
            </select>
            <button onClick={handleCreateExam} className={`px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap rounded ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-black'}`}>
              + Ujian Baru
            </button>
          </div>
        </div>

        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 p-6 rounded-xl border border-dashed transition-colors ${isDark ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-500/30 bg-emerald-50'}`}>
          <div>
            <h2 className={`text-sm font-bold tracking-tight mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Impor Massal (Excel)</h2>
            <p className={`text-xs ${isDark ? 'text-emerald-500/80' : 'text-emerald-600/80'}`}>Masukkan ratusan soal sekaligus tanpa mengetik satu per satu.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadTemplate}
              className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 rounded transition-colors ${isDark ? 'bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800' : 'bg-white text-zinc-600 hover:text-black hover:bg-zinc-50 border border-zinc-200'}`}
            >
              <Download size={14} /> Template
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || !selectedExamId}
              className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 rounded transition-colors disabled:opacity-50 ${isDark ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
            >
              <Upload size={14} /> {loading ? "Memproses..." : "Upload .xlsx"}
            </button>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={openBankModal}
              disabled={!selectedExamId}
              className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 rounded transition-colors disabled:opacity-50 ${isDark ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
            >
              <ShieldCheck size={14} /> Pilih dari Bank
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Form (Minimal) */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Tulis Pertanyaan Baru
              </label>

              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <select 
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className={`w-full p-3 text-sm outline-none transition-colors border ${isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white focus:border-zinc-500' : 'bg-white border-zinc-200 text-black focus:border-zinc-400'}`}
                  >
                    <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                    <option value="SHORT_ANSWER">Isian Singkat</option>
                    <option value="ESSAY">Esai</option>
                  </select>
                </div>
                <div className="w-32">
                  <input 
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    placeholder="Poin"
                    min="0"
                    step="0.5"
                    title="Bobot Nilai Maksimal"
                    className={`w-full p-3 text-sm outline-none transition-colors border ${isDark ? 'bg-[#0a0a0a] border-zinc-800 text-white focus:border-zinc-500' : 'bg-white border-zinc-200 text-black focus:border-zinc-400'}`}
                  />
                </div>
              </div>

              <textarea 
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Masukkan teks soal..."
                className={`w-full p-4 text-sm outline-none resize-y transition-colors border ${isDark ? 'bg-transparent border-zinc-800 text-white placeholder-zinc-700 focus:border-zinc-500' : 'bg-transparent border-zinc-200 text-black placeholder-zinc-300 focus:border-zinc-400'}`}
              />
              
              <div className="mt-4">
                <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Gambar Pendukung (Opsional, Maks 5MB)
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'} file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-medium file:transition-colors ${isDark ? 'file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700' : 'file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200'} disabled:opacity-50`}
                  />
                  {isUploadingImage && <span className="text-xs text-amber-500 animate-pulse">Mengunggah...</span>}
                </div>
                {imageUrl && (
                  <div className="mt-4 relative inline-block">
                    <img src={imageUrl} alt="Preview" className="max-h-40 rounded border border-zinc-700 object-contain" />
                    <button 
                      onClick={() => setImageUrl("")}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors flex items-center justify-center"
                      title="Hapus gambar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {questionType === "MULTIPLE_CHOICE" && (
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Opsi Jawaban
              </label>
              <div className="space-y-0">
                {options.map((opt, idx) => (
                  <div key={idx} className={`group flex items-center gap-4 py-3 border-b transition-colors ${isDark ? 'border-zinc-900 hover:bg-zinc-900/30' : 'border-zinc-50 hover:bg-zinc-50'}`}>
                    <button 
                      onClick={() => handleSetCorrect(idx)}
                      className={`flex-shrink-0 flex items-center justify-center transition-colors ${opt.isCorrect ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-zinc-700 hover:text-zinc-500' : 'text-zinc-300 hover:text-zinc-400')}`}
                    >
                      <CheckCircle size={16} />
                    </button>
                    <input 
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                      className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-zinc-300 placeholder-zinc-700' : 'text-zinc-700 placeholder-zinc-300'}`}
                    />
                    <button onClick={() => removeOption(idx)} className={`transition-colors opacity-0 group-hover:opacity-100 ${isDark ? 'text-zinc-600 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-start items-center mt-6">
                <button onClick={addOption} className={`text-xs font-medium transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>
                  + Tambah Opsi
                </button>
              </div>
            </div>
            )}

            {questionType === "SHORT_ANSWER" && (
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Kunci Jawaban Singkat
                </label>
                <input 
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Ketik kunci jawaban persis..."
                  className={`w-full p-4 text-sm outline-none transition-colors border ${isDark ? 'bg-transparent border-zinc-800 text-white placeholder-zinc-700 focus:border-zinc-500' : 'bg-transparent border-zinc-200 text-black placeholder-zinc-300 focus:border-zinc-400'}`}
                />
              </div>
            )}

            <div className="flex justify-end items-center mt-6">
                <button 
                  onClick={handleSaveQuestion}
                  disabled={loading || !selectedExamId}
                  className={`px-6 py-2.5 text-xs font-medium rounded transition-colors disabled:cursor-not-allowed ${
                    isDark 
                      ? 'bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600' 
                      : 'bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400'
                  }`}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Soal'}
                </button>
            </div>
          </div>

          {/* Right Column: Question List (Minimal) */}
          <div className="lg:col-span-1">
            <div className={`text-xs font-bold uppercase tracking-widest mb-4 flex justify-between items-center ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              <span>Daftar Soal</span>
              <span>{questions.length}</span>
            </div>
            
            <div className="space-y-0">
              {questions.length === 0 ? (
                <div className={`py-10 text-sm ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Pilih modul untuk melihat soal.
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id} className={`py-4 border-b ${isDark ? 'border-zinc-900' : 'border-zinc-100'}`}>
                    <div className={`text-[10px] font-bold mb-2 uppercase tracking-widest flex justify-between ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      <span>Soal {idx + 1}</span>
                      <div className="flex gap-2">
                        <span className="font-normal px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">{q.points || 1} Poin</span>
                        <span className="font-normal px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">{q.type === 'SHORT_ANSWER' ? 'Isian Singkat' : q.type === 'ESSAY' ? 'Esai' : 'Pilihan Ganda'}</span>
                      </div>
                    </div>
                    <div className={`text-sm mb-3 leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{q.text}</div>
                    
                    {q.imageUrl && (
                      <div className="mb-4">
                        <img src={q.imageUrl} alt="Soal Image" className="max-h-40 rounded border border-zinc-700 object-contain" />
                      </div>
                    )}
                    
                    {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-1">
                      {q.options.map((opt: any) => (
                        <div key={opt.id} className={`text-xs flex items-center gap-2 ${opt.isCorrect ? (isDark ? 'text-white font-medium' : 'text-black font-medium') : (isDark ? 'text-zinc-600' : 'text-zinc-400')}`}>
                          {opt.isCorrect && <CheckCircle size={10} />}
                          <span className={opt.isCorrect ? '' : 'pl-4'}>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                    )}

                    {q.type === 'SHORT_ANSWER' && (
                      <div className={`text-xs p-3 rounded border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'}`}>
                        <span className="font-semibold mr-2 opacity-50">Kunci:</span> {q.correctAnswer}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Floating Superadmin Button */}
      {(session?.user as any)?.role === "SUPERADMIN" && (
        <Link href="/superadmin" className={`fixed bottom-6 right-6 px-4 py-3 rounded-full shadow-lg shadow-amber-500/20 font-medium flex items-center gap-2 transition-transform hover:scale-105 z-50 ${isDark ? 'bg-amber-500 text-black' : 'bg-amber-600 text-white'}`}>
          <ShieldAlert size={18} />
          Superadmin Panel
        </Link>
      )}

      {/* Bank Soal Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl overflow-hidden shadow-2xl ${isDark ? 'bg-[#111] border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Pilih dari Bank Soal</h3>
              <button onClick={() => setShowBankModal(false)} className={`text-sm ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`}>Tutup</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {bankQuestions.length === 0 ? (
                <div className={`text-center py-10 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Tidak ada soal tersedia di bank yang belum ditambahkan ke ujian ini.
                </div>
              ) : (
                bankQuestions.map(q => (
                  <div 
                    key={q.id} 
                    onClick={() => toggleBankQuestion(q.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors flex gap-4 ${
                      selectedBankQuestions.has(q.id) 
                        ? (isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200')
                        : (isDark ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-200 hover:border-zinc-300')
                    }`}
                  >
                    <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      selectedBankQuestions.has(q.id)
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : isDark ? 'border-zinc-700' : 'border-zinc-300'
                    }`}>
                      {selectedBankQuestions.has(q.id) && <CheckCircle size={12} />}
                    </div>
                    <div>
                      <div className="flex gap-2 mb-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>{q.type}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>{q.points} Poin</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${q.difficulty === 'HARD' ? 'bg-rose-500/10 text-rose-500' : q.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {q.difficulty || "MEDIUM"}
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{q.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={`px-6 py-4 border-t flex justify-between items-center ${isDark ? 'border-zinc-800 bg-[#0a0a0a]' : 'border-zinc-100 bg-zinc-50'}`}>
              <div className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {selectedBankQuestions.size} soal dipilih
              </div>
              <button 
                onClick={handleLinkQuestions}
                disabled={selectedBankQuestions.size === 0 || isLinking}
                className={`px-6 py-2.5 text-sm font-medium rounded transition-colors disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
              >
                {isLinking ? "Menambahkan..." : "Tambahkan ke Ujian"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
