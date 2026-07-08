# Safe Exam Browser (SEB) Integration Design

## Overview
Integrate Safe Exam Browser (SEB) into Olym-App to allow administrators to optionally lock down the testing environment per exam. This integration supports a Hybrid approach: a Basic mode (User-Agent detection) and a Strict mode (Browser Exam Key hash validation).

## 1. Database Changes
Update the Prisma schema (`schema.prisma`) by adding two fields to the `Exam` model:
- `requireSeb Boolean @default(false)`
- `sebExamKey String?`

## 2. Admin UI
**File:** Form creation/edit component for Exams (e.g., inside `src/app/admin/exams/...`).
- Add a checkbox toggle: "Wajib menggunakan Safe Exam Browser".
- If the checkbox is checked, conditionally reveal a text input: "Browser Exam Key (Opsional)".
- Add helper text/tooltip: *"Kosongkan jika hanya ingin pengecekan dasar. Isi dengan Kunci Ujian dari aplikasi SEB Config Tool untuk keamanan ketat."*

## 3. Core Logic & Validation (Backend)
**File:** API endpoints that serve the exam to the student (e.g., `src/app/api/exams/[id]/route.ts` or student submission endpoint).
Validation Logic when a student accesses an exam:
- If `requireSeb` is `false`: Allow access normally.
- If `requireSeb` is `true`:
  - Verify the `User-Agent` header contains the string `SafeExamBrowser`. If not, return error `SEB_REQUIRED`.
  - If `sebExamKey` is not null (Strict Mode enabled):
    - Read the `X-SafeExamBrowser-RequestHash` header.
    - Re-compute the expected hash: `sha256(request_url + sebExamKey)`.
    - If the computed hash does not match the header, return error `SEB_CONFIG_INVALID`.
- *Error Handling:* Return a 403 Forbidden with the specific error code in the JSON body.

## 4. Student UI
**File:** Student exam page (e.g., `src/app/exam/[id]/page.tsx`).
- When the API returns a 403 SEB error, block the rendering of the exam questions.
- Display a dedicated warning screen instead:
  - If `SEB_REQUIRED`: "Akses Ditolak: Ujian ini hanya dapat diakses melalui aplikasi Safe Exam Browser."
  - If `SEB_CONFIG_INVALID`: "Akses Ditolak: Konfigurasi SEB Anda tidak valid atau kadaluarsa. Silakan minta file .seb resmi kepada pengawas."
