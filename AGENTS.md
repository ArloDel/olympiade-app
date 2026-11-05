<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git Workflow Rules

## 1. Master Branch Protection
**Rule**: Do NOT automatically merge branches into `master`. 
Always wait for the user's explicit command or approval before performing a `git merge` into the `master` branch.

## 2. Maximize Commit Granularity (Wajib Memaksimalkan Jumlah Commit)
**Rule**: Dilarang menggabungkan banyak perubahan ke dalam satu commit besar ("jangan cuman 1 commit"). Selalu pecah dan maksimalkan jumlah commit menjadi commit-commit kecil, atomik, dan terpisah:
- **1 Perubahan Logis / File = 1 Commit Terpisah**: Jika ada beberapa file, fitur, atau perbaikan yang diubah, buat commit terpisah untuk masing-masing perubahan (misal: 1 commit per aset, 1 commit per endpoint/komponen, 1 commit untuk dokumentasi/README).
- **Atomic Commits**: Setiap commit harus fokus pada satu fungsi spesifik yang dapat dilacak (*self-contained*).
- **Conventional Commits**: Format pesan commit wajib jelas dan konsisten (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **Stage Surgically**: Gunakan `git add <file>` secara terpisah untuk setiap commit daripada `git add .` secara borongan.
