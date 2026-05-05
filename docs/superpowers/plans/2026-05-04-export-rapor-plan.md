# Export Rapor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menerapkan fitur ekspor nilai rapor yang komprehensif ke format PDF dan Excel, termasuk durasi pengerjaan dan data proctoring.

**Architecture:** Membangun *endpoint* API baru untuk mencatat waktu mulai ujian (START), memperbarui API *results* untuk mengkalkulasi durasi dan mengambil data pelanggaran, dan menambahkan logika pembuatan dokumen *client-side* menggunakan `jspdf` dan `xlsx` di halaman Admin Results.

**Tech Stack:** Next.js App Router, Prisma ORM, jspdf, jspdf-autotable, xlsx.

---

### Task 1: Create Start Exam API Endpoint

Kita perlu mencatat kapan ujian dimulai agar bisa menghitung durasi pengerjaan.

**Files:**
- Create: `src/app/api/exams/[id]/start/route.ts`

- [ ] **Step 1: Write the API implementation**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const examId = resolvedParams.id;
    const userId = session.user.id;

    // Check if START event already exists
    const existingLog = await prisma.sessionLog.findFirst({
      where: {
        userId,
        examId,
        eventType: "START"
      }
    });

    if (!existingLog) {
      await prisma.sessionLog.create({
        data: {
          userId,
          examId,
          eventType: "START",
          details: "Exam started"
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/exams/[id]/start/route.ts
git commit -m "feat(api): add endpoint to log exam START event"
```

---

### Task 2: Trigger Start Event from Frontend

**Files:**
- Modify: `src/app/exam/[id]/page.tsx`

- [ ] **Step 1: Trigger start API on successful fetch**

Gunakan fungsi penggantian string untuk memanggil API start di fungsi `fetchQuestions`. Kita tidak perlu tes, kita hanya ubah logic.

Ganti kode ini:
```typescript
      if (data.success) {
        setQuestions(data.data)
      } else {
```

Menjadi ini:
```typescript
      if (data.success) {
        setQuestions(data.data)
        // Trigger START log
        fetch(`/api/exams/${examId}/start`, { method: "POST" }).catch(console.error)
      } else {
```

- [ ] **Step 2: Commit**

```bash
git add src/app/exam/[id]/page.tsx
git commit -m "feat(frontend): trigger exam start log on load"
```

---

### Task 3: Enhance Results API

**Files:**
- Modify: `src/app/api/admin/exams/[id]/results/route.ts`

- [ ] **Step 1: Fetch session logs and warnings**

Ganti baris `const students = await prisma.user.findMany({...})` hingga sebelum kalkulasi hasil (sekitar baris 40) dengan query baru:

```typescript
    // Fetch all students including their warnings and session logs for this exam
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { 
        id: true, 
        name: true, 
        email: true,
        warnings: true,
        sessionLogs: {
          where: { examId: examId },
          select: { eventType: true, createdAt: true }
        }
      }
    });
```

Kemudian ubah struktur kembalian (sekitar baris 85) menjadi:

```typescript
      // Calculate duration
      let durationStr = "-";
      const startLog = student.sessionLogs.find(l => l.eventType === "START");
      const finishLog = student.sessionLogs.find(l => l.eventType === "FINISH");
      
      if (startLog && finishLog) {
        const diffMs = finishLog.createdAt.getTime() - startLog.createdAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        durationStr = `${diffMins} menit`;
      } else if (studentAnswers.length > 0) {
        durationStr = "Selesai (N/A)";
      }

      return {
        id: student.id,
        name: student.name || "Unknown",
        email: student.email || "No Email",
        duration: durationStr,
        warnings: student.warnings || 0,
        correctAnswers,
        wrongAnswers: totalWrong,
        unanswered,
        score: parseFloat(score.toFixed(2)),
        isSubmitted: studentAnswers.length > 0
      };
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/exams/[id]/results/route.ts
git commit -m "feat(api): include duration and warnings in results api"
```

---

### Task 4: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

Run: `npm install jspdf jspdf-autotable xlsx`

- [ ] **Step 2: Verify installation**

Pastikan *dependencies* masuk ke `package.json`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: install jspdf, jspdf-autotable, xlsx"
```

---

### Task 5: Implement Export Logic & UI in Results Page

**Files:**
- Modify: `src/app/admin/results/page.tsx`

- [ ] **Step 1: Tambahkan Imports**

Di atas file, tambahkan:
```typescript
import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"
import { FileText, FileSpreadsheet } from "lucide-react"
```

- [ ] **Step 2: Replace `exportToCSV` function**

Ganti `const exportToCSV = () => { ... }` dengan `exportToPDF` dan `exportToExcel`:

```typescript
  const getTableData = () => {
    if (!resultsData || !resultsData.results) return []
    return resultsData.results.map((r: any, index: number) => [
      index + 1,
      r.name,
      r.email,
      r.duration || "-",
      r.warnings || 0,
      r.correctAnswers,
      r.wrongAnswers,
      r.unanswered,
      r.score,
      r.isSubmitted ? "Selesai" : "Belum"
    ])
  }

  const exportToPDF = () => {
    if (!resultsData || !resultsData.results) return
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text("Laporan Hasil Ujian - OlymApp", 14, 20)
    
    doc.setFontSize(12)
    doc.text(`Modul: ${resultsData.examTitle}`, 14, 28)
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 34)

    const headers = [["No", "Nama", "Email", "Durasi", "Pelanggaran", "B", "S", "K", "Skor", "Status"]]
    
    ;(doc as any).autoTable({
      startY: 40,
      head: headers,
      body: getTableData(),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 41, 41] },
    })

    doc.save(`Rapor_${resultsData.examTitle.replace(/\s+/g, "_")}.pdf`)
  }

  const exportToExcel = () => {
    if (!resultsData || !resultsData.results) return
    const headers = ["No", "Nama", "Email", "Durasi", "Pelanggaran", "Benar", "Salah", "Kosong", "Skor", "Status"]
    const data = [headers, ...getTableData()]
    
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai")
    
    XLSX.writeFile(wb, `Rapor_${resultsData.examTitle.replace(/\s+/g, "_")}.xlsx`)
  }
```

- [ ] **Step 3: Update Table Header to Match New Columns**

Ganti struktur `grid-cols-12` di UI (sekitar baris 200+):
```typescript
                {/* Header */}
                <div className={`grid grid-cols-12 gap-4 pb-4 text-[10px] font-bold uppercase tracking-widest border-b ${isDark ? 'text-zinc-600 border-zinc-900' : 'text-zinc-400 border-zinc-100'}`}>
                  <div className="col-span-2">Nama</div>
                  <div className="col-span-2">Email</div>
                  <div className="col-span-1 text-center">Durasi</div>
                  <div className="col-span-1 text-center" title="Pelanggaran">Pel.</div>
                  <div className="col-span-1 text-center">Benar</div>
                  <div className="col-span-1 text-center">Salah</div>
                  <div className="col-span-1 text-center">Kosong</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-1 text-right">Skor</div>
                </div>

                {/* Rows */}
```

Lalu sesuaikan *mapping* data `filteredResults.map`:
```typescript
                      <div className={`col-span-2 truncate font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{r.name}</div>
                      <div className={`col-span-2 truncate text-[10px] font-mono mt-0.5 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{r.email}</div>
                      <div className="col-span-1 text-center text-xs">{r.duration || "-"}</div>
                      <div className={`col-span-1 text-center text-xs ${r.warnings > 0 ? 'text-rose-500 font-bold' : ''}`}>{r.warnings || 0}</div>
                      <div className="col-span-1 text-center font-medium">{r.correctAnswers}</div>
                      <div className="col-span-1 text-center font-medium">{r.wrongAnswers}</div>
                      <div className={`col-span-1 text-center text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{r.unanswered}</div>
                      <div className="col-span-2 flex justify-center">
```

- [ ] **Step 4: Update Action Buttons**

Ganti tombol "Export CSV" dengan dua tombol baru:
```typescript
            <div className="flex items-center gap-2">
              <button 
                onClick={exportToPDF}
                disabled={!resultsData || resultsData.results.length === 0}
                className={`px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap rounded disabled:cursor-not-allowed flex items-center gap-2 ${
                  isDark 
                    ? 'bg-rose-900/20 text-rose-500 hover:bg-rose-900/40 disabled:bg-zinc-900 disabled:text-zinc-600' 
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:bg-zinc-100 disabled:text-zinc-400'
                }`}
              >
                <FileText size={14} /> Cetak PDF
              </button>
              
              <button 
                onClick={exportToExcel}
                disabled={!resultsData || resultsData.results.length === 0}
                className={`px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap rounded disabled:cursor-not-allowed flex items-center gap-2 ${
                  isDark 
                    ? 'bg-emerald-900/20 text-emerald-500 hover:bg-emerald-900/40 disabled:bg-zinc-900 disabled:text-zinc-600' 
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:bg-zinc-100 disabled:text-zinc-400'
                }`}
              >
                <FileSpreadsheet size={14} /> Export Excel
              </button>
            </div>
```
*(Ingat untuk menghapus tombol Export CSV lama)*

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/results/page.tsx
git commit -m "feat(ui): implement export PDF and Excel functions for results"
```
