# Design Specification: Ekspor Nilai Rapor (PDF & Excel)

## 1. Overview
Fitur ini memungkinkan Administrator untuk mengunduh laporan hasil ujian (rapor) secara komprehensif, terstruktur, dan profesional dalam dua format utama: PDF dan Excel.

## 2. Pendekatan Teknis
Menggunakan pendekatan **Client-Side Generation** untuk meminimalisir beban server.
- **PDF Generation**: Menggunakan `jspdf` dan `jspdf-autotable`.
- **Excel Generation**: Menggunakan `xlsx`.

## 3. Struktur Dokumen Laporan
Baik dalam format PDF maupun Excel, laporan harus memuat elemen-elemen berikut:

### 3.1 Kop Laporan (Header)
- **Judul**: Laporan Hasil Ujian - OlymApp
- **Modul**: [Judul Ujian]
- **Dicetak pada**: [Tanggal & Jam Cetak]

### 3.2 Tabel Data Analitik Peserta
Memuat kolom-kolom berikut secara berurutan:
1. **No**: Nomor urut
2. **Nama Peserta**: Nama lengkap peserta
3. **Email**: Alamat email peserta
4. **Durasi**: Lama pengerjaan (dihitung dari selisih waktu mulai sesi ujian dan waktu submit)
5. **Pelanggaran**: Jumlah peringatan (dari aktivitas *proctoring* seperti pindah tab)
6. **Benar**: Jumlah jawaban benar
7. **Salah**: Jumlah jawaban salah
8. **Kosong**: Jumlah soal tidak dijawab
9. **Skor**: Skor akhir ujian
10. **Status**: 'Selesai' atau 'Belum'

## 4. Perubahan Kode (Impacted Areas)

### 4.1 Backend (API)
- **File**: `src/app/api/admin/exams/[id]/results/route.ts`
- **Perubahan**: Menambahkan `duration` (waktu pengerjaan) dan `warnings` (jumlah pelanggaran) dalam data yang dikembalikan (respons API). Perhitungan durasi dapat diambil dari selisih `updatedAt` / waktu submit dengan `createdAt` di tabel partisipasi/jawaban atau sesi.

### 4.2 Frontend (UI/UX)
- **File**: `src/app/admin/results/page.tsx`
- **Perubahan**: 
  - Mengganti tombol "Export CSV" dengan dua tombol terpisah: "Cetak PDF" (ikon PDF) dan "Export Excel" (ikon Excel).
  - Menambahkan *dependency* impor untuk pembuat laporan klien (`jspdf`, `jspdf-autotable`, `xlsx`).
  - Menyusun *styling* tabel di PDF agar berpenampilan profesional dan rapi menggunakan `jspdf-autotable`.

## 5. Security & Error Handling
- Ekspor data hanya tersedia jika data respons dari server valid dan ada minimal satu peserta.
- Menambahkan status *loading* saat pembuatan PDF/Excel sedang berjalan agar UI tidak terkesan *freeze*.
