# Safe Exam Browser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Safe Exam Browser (SEB) with Basic and Strict mode options per exam to prevent cheating.

**Architecture:** Add `requireSeb` and `sebExamKey` to `Exam` schema. Update the Admin UI to toggle these. Enforce the SEB validation in `GET /api/questions` for students by checking the `User-Agent` and `X-SafeExamBrowser-RequestHash` headers. Show a full-screen block UI in the student's exam page if validation fails.

**Tech Stack:** Next.js App Router, Prisma, Web Crypto API.

---

### Task 1: Update Database Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update Exam model**
Modify `prisma/schema.prisma` to add `requireSeb` and `sebExamKey` to the `Exam` model.

```prisma
// Locate the Exam model and add these fields:
model Exam {
  id                 String         @id @default(cuid())
  title              String
  description        String?
  startTime          DateTime
  endTime            DateTime
  duration           Int            // in minutes
  isActive           Boolean        @default(false)
  isFinished         Boolean        @default(false)
  randomizeQuestions Boolean        @default(false)
  randomizeOptions   Boolean        @default(false)
  requireSeb         Boolean        @default(false)
  sebExamKey         String?
  
  // ... rest of the model stays the same
}
```

- [ ] **Step 2: Push database changes**
Run: `npx prisma db push`
Expected: Success message indicating the database was synced and the Prisma Client was generated.

- [ ] **Step 3: Commit (if auto_commit enabled)**
Check `.agent/config.yml` for `auto_commit` setting.
If `auto_commit: true`:
```bash
git add prisma/schema.prisma
git commit -m "feat: add SEB fields to Exam model"
```
If `auto_commit: false`: skip commit and staging. Print: "Skipping commit (auto_commit: false)."

---

### Task 2: Update Admin Exams UI

**Files:**
- Modify: `src/app/admin/exams/page.tsx`

- [ ] **Step 1: Update formData initial state**
Modify `formData` state to include the new SEB fields.

```tsx
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    duration: 120,
    randomizeQuestions: false,
    randomizeOptions: false,
    requireSeb: false,
    sebExamKey: "",
  })
```

- [ ] **Step 2: Update handleOpenModal to populate SEB fields**
Inside `handleOpenModal(exam?: any)`:

```tsx
// If exam exists
      setFormData({
        title: exam.title,
        description: exam.description || "",
        startTime: new Date(exam.startTime).toISOString().slice(0, 16),
        endTime: new Date(exam.endTime).toISOString().slice(0, 16),
        duration: exam.duration,
        randomizeQuestions: exam.randomizeQuestions || false,
        randomizeOptions: exam.randomizeOptions || false,
        requireSeb: exam.requireSeb || false,
        sebExamKey: exam.sebExamKey || "",
      })
// If new exam (else block)
      setFormData({
        title: "",
        description: "",
        startTime: now.toISOString().slice(0, 16),
        endTime: tomorrow.toISOString().slice(0, 16),
        duration: 120,
        randomizeQuestions: false,
        randomizeOptions: false,
        requireSeb: false,
        sebExamKey: "",
      })
```

- [ ] **Step 3: Add SEB fields to the form UI**
Inside the form, right after the randomize checkboxes (`<div className="grid grid-cols-2 gap-4 pt-2">...</div>`), add the SEB toggle and key input:

```tsx
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="requireSeb"
                    checked={formData.requireSeb}
                    onChange={e => setFormData({...formData, requireSeb: e.target.checked})}
                    className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black accent-black"
                  />
                  <label htmlFor="requireSeb" className={`text-xs font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    Wajib menggunakan Safe Exam Browser
                  </label>
                </div>
                
                {formData.requireSeb && (
                  <div className="space-y-1 pl-6">
                    <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      Browser Exam Key (Opsional)
                    </label>
                    <input 
                      type="text" 
                      value={formData.sebExamKey}
                      onChange={e => setFormData({...formData, sebExamKey: e.target.value})}
                      className={`w-full px-0 py-2.5 text-sm outline-none transition-colors border-b bg-transparent ${isDark ? 'border-zinc-800 text-white placeholder-zinc-700 focus:border-white' : 'border-zinc-200 text-black placeholder-zinc-400 focus:border-black'}`}
                      placeholder="Kosongkan untuk mode dasar (Hanya User-Agent)"
                    />
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      Isi dengan Kunci Ujian (BEK) dari aplikasi SEB Config Tool untuk keamanan ketat.
                    </p>
                  </div>
                )}
              </div>
```

- [ ] **Step 4: Commit (if auto_commit enabled)**
Check `.agent/config.yml` for `auto_commit` setting.
If `auto_commit: true`:
```bash
git add src/app/admin/exams/page.tsx
git commit -m "feat: add SEB configuration to Admin UI"
```
If `auto_commit: false`: skip commit and staging. Print: "Skipping commit (auto_commit: false)."

---

### Task 3: Backend Verification Logic

**Files:**
- Modify: `src/app/api/questions/route.ts`

- [ ] **Step 1: Add Web Crypto Hash Utility**
At the top of `src/app/api/questions/route.ts`, add a helper function to compute the SHA256 hash using the native Node Web Crypto API.

```typescript
import { crypto } from "crypto";

async function computeSEBHash(url: string, examKey: string) {
  const data = url + examKey;
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
```

- [ ] **Step 2: Fetch SEB Fields in GET**
In `export async function GET(req: Request)`, update the exam fetch query to include `requireSeb` and `sebExamKey`.

```typescript
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: { randomizeQuestions: true, randomizeOptions: true, requireSeb: true, sebExamKey: true }
      });
```

- [ ] **Step 3: Implement SEB Verification**
Immediately after `const exam = ...` block, add the SEB check logic for STUDENTS.

```typescript
      if (role === "STUDENT" && exam?.requireSeb) {
        const userAgent = req.headers.get("user-agent") || "";
        if (!userAgent.includes("SafeExamBrowser")) {
          return NextResponse.json({ success: false, error: "SEB_REQUIRED" }, { status: 403 });
        }

        if (exam.sebExamKey && exam.sebExamKey.trim() !== "") {
          const requestHash = req.headers.get("x-safeexambrowser-requesthash");
          if (!requestHash) {
            return NextResponse.json({ success: false, error: "SEB_CONFIG_INVALID" }, { status: 403 });
          }
          
          // Compute hash. req.url is the absolute URL requested.
          const computedHash = await computeSEBHash(req.url, exam.sebExamKey.trim());
          if (computedHash !== requestHash) {
            return NextResponse.json({ success: false, error: "SEB_CONFIG_INVALID" }, { status: 403 });
          }
        }
      }
```

- [ ] **Step 4: Commit (if auto_commit enabled)**
Check `.agent/config.yml` for `auto_commit` setting.
If `auto_commit: true`:
```bash
git add src/app/api/questions/route.ts
git commit -m "feat: enforce SEB checks in questions API"
```
If `auto_commit: false`: skip commit and staging. Print: "Skipping commit (auto_commit: false)."

---

### Task 4: Student UI Updates

**Files:**
- Modify: `src/app/exam/[id]/page.tsx`

- [ ] **Step 1: Add sebError state**
In `ExamTakingInterface`, add a state for SEB errors near the other states.

```tsx
  const [sebError, setSebError] = useState<string | null>(null)
```

- [ ] **Step 2: Catch SEB errors in fetchQuestions**
Modify the `fetchQuestions` function to catch the new error codes.

```tsx
      const res = await fetch(`/api/questions?examId=${examId}`)
      const data = await res.json()
      if (data.success) {
        setQuestions(data.data)
        // ... (existing cache and START log logic)
      } else {
        if (data.error === "SEB_REQUIRED" || data.error === "SEB_CONFIG_INVALID") {
          setSebError(data.error)
        } else {
          console.error(data.error)
        }
      }
```

- [ ] **Step 3: Render the Blocking SEB Error UI**
Right before `if (questions.length === 0)` (around line 359), add a render block for `sebError`.

```tsx
  if (sebError) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors ${isDark ? 'bg-rose-950 text-rose-200' : 'bg-rose-50 text-rose-900'} gap-6`}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-rose-500/20 text-rose-500 mb-2 shadow-lg shadow-rose-500/20">
          <ShieldOff size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-3 tracking-tight">Akses Ditolak</h1>
          <p className="max-w-md mx-auto text-sm leading-relaxed opacity-90">
            {sebError === "SEB_REQUIRED" 
              ? "Ujian ini hanya dapat diakses melalui aplikasi Safe Exam Browser (SEB). Harap buka link ujian ini menggunakan SEB."
              : "Konfigurasi SEB Anda tidak valid atau kadaluarsa. Silakan gunakan file konfigurasi (.seb) resmi yang diberikan oleh pengawas."}
          </p>
        </div>
        <button onClick={() => router.push("/dashboard")} className="mt-4 text-xs font-medium px-6 py-3 rounded-full transition-all bg-rose-600 text-white hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-600/30">
          Kembali ke Dashboard
        </button>
      </div>
    )
  }
```

- [ ] **Step 4: Import ShieldOff Icon**
At the top of the file, make sure to import `ShieldOff` from `lucide-react`.

```tsx
import { Clock, ChevronLeft, ChevronRight, Flag, LayoutGrid, X, Moon, Sun, Shield, ShieldOff, WifiOff } from "lucide-react"
```

- [ ] **Step 5: Commit (if auto_commit enabled)**
Check `.agent/config.yml` for `auto_commit` setting.
If `auto_commit: true`:
```bash
git add src/app/exam/[id]/page.tsx
git commit -m "feat: display SEB error screen to students"
```
If `auto_commit: false`: skip commit and staging. Print: "Skipping commit (auto_commit: false)."
