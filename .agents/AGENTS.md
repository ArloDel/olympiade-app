# Git Workflow Rules

## 1. Master Branch Protection
**Rule**: Do NOT automatically merge branches into `master`. 
Always wait for the user's explicit command or approval before performing a `git merge` into the `master` branch.

## 2. Maximize Commit Granularity (Wajib Memaksimalkan Jumlah Commit)
**Rule**: Dilarang menggabungkan banyak perubahan ke dalam satu commit besar ("jangan cuman 1 commit"). Selalu pecah dan maksimalkan jumlah commit menjadi commit-commit kecil, atomik, dan terpisah:
- **1 Perubahan Logis / File = 1 Commit Terpisah**: Jika ada beberapa file, fitur, atau perbaikan yang diubah, buat commit terpisah untuk masing-masing perubahan (misal: 1 commit per aset, 1 commit per endpoint/komponen, 1 commit untuk dokumentasi/README).
- **Atomic Commits**: Setiap commit harus fokus pada satu fungsi spesifik yang dapat dilacak (*self-contained*).
- **Conventional Commits**: Format pesan commit wajib jelas dan konsisten:
  - `feat(<scope>): ...` untuk penambahan fitur baru / aset baru
  - `fix(<scope>): ...` untuk perbaikan bug / aset / logika
  - `refactor(<scope>): ...` untuk pembersihan atau restrukturisasi kode
  - `docs(<scope>): ...` untuk dokumentasi / README
  - `test(<scope>): ...` untuk penambahan atau perbaikan unit/e2e test
  - `chore(<scope>): ...` untuk konfigurasi, dependency, atau utilitas
- **Stage Surgically**: Gunakan `git add <file>` secara terpisah untuk setiap commit daripada `git add .` secara borongan.
