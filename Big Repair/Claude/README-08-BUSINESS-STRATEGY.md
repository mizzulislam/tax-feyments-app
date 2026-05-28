# 🟡 README-08: Strategi Bisnis, Fokus Pengguna & Izin PJAP

**Prioritas: MENENGAH (untuk roadmap jangka panjang)**

---

## Masalah

### 1. Identity Crisis — Mencoba Melayani Semua Orang

Saat ini aplikasi menargetkan: karyawan, UMKM, investor, konsultan pajak, admin, dan bahkan persona AI bertema K-Pop. Hasilnya tidak ada yang dilayani dengan sempurna.

### 2. Kompetitor yang Sudah Established

| Kompetitor | Keunggulan | Status |
|------------|------------|--------|
| OnlinePajak | Integrasi DJP, ribuan pengguna korporat | Sudah punya PJAP |
| Klikpajak | Fokus UMKM, integrasi faktur pajak | Sudah punya PJAP |
| Pajak.io | Izin PJAP resmi dari DJP | Sudah punya PJAP |

### 3. Tidak Ada Izin PJAP

PJAP (Perusahaan Jasa Aplikasi Perpajakan) adalah izin dari DJP yang **wajib dimiliki** jika ingin menjadi penyedia jasa aplikasi perpajakan secara legal. Tanpa ini, aplikasi tidak bisa secara legal memproses atau menyampaikan SPT atas nama pengguna.

---

## Rekomendasi Strategi

### Step 1 — Pilih Satu Segmen Utama dan Kuasai

**Rekomendasi segmen:** Karyawan dengan penghasilan campuran (gaji tetap + penghasilan lain seperti freelance, investasi, atau sewa properti).

**Alasan:**
- Segmen yang besar dan underserved — aplikasi DJP dan OnlinePajak sulit dipakai oleh individu non-HR
- Masalah yang jelas: banyak karyawan bingung bagaimana menggabungkan PPh 21 dari kantor dengan penghasilan sampingan
- Tidak butuh izin PJAP hanya untuk kalkulasi dan edukasi

**Fitur yang harus sempurna dulu (sebelum ekspansi):**
1. ✅ Kalkulasi PPh 21 yang akurat dan mudah dipahami
2. ✅ Panduan lapor SPT Tahunan (edukasi, bukan processing)
3. ✅ Pengingat deadline pajak yang relevan
4. ✅ Rekap penghasilan dari berbagai sumber

---

### Step 2 — Fokus pada Nilai Nyata yang Tidak Butuh PJAP

Yang bisa dilakukan **tanpa** izin PJAP:
- ✅ Kalkulator pajak (estimasi)
- ✅ Edukasi perpajakan
- ✅ Pengingat deadline pajak
- ✅ Panduan cara menggunakan sistem resmi DJP
- ✅ Export data dalam format yang mudah diinput ke DJP Online secara manual

Yang **butuh** izin PJAP:
- ❌ Menyampaikan SPT atas nama pengguna
- ❌ Mengakses data EFIN atau sistem DJP secara langsung
- ❌ Memproses pembayaran pajak

**Rekomendasi konkret — tambahkan fitur export:**

```typescript
// src/lib/exportToDJP.ts

/**
 * Export data kalkulasi ke format CSV yang bisa diimport ke e-Filing DJP
 * Ini memberikan nilai nyata tanpa perlu integrasi API resmi DJP
 */
export function exportToCSVForDJP(taxData: TaxCalculationResult): string {
  // Format kolom sesuai ekspektasi DJP Online
  const headers = [
    'Jenis Penghasilan',
    'Jumlah Bruto',
    'Pengurang',
    'Penghasilan Neto',
    'PPh Terutang',
    'PPh Dipotong Pemberi Kerja',
    'PPh Kurang/Lebih Bayar'
  ];
  
  const rows = [
    headers.join(','),
    formatTaxRow(taxData),
  ];
  
  return rows.join('\n');
}

export function generateExportGuide(): string {
  return `
PANDUAN IMPORT DATA KE DJP ONLINE
===================================

File CSV ini berisi ringkasan data pajak Anda.
Cara menggunakannya:

1. Login ke djponline.pajak.go.id
2. Pilih menu Lapor → e-Filing
3. Ikuti panduan pengisian SPT
4. Gunakan angka-angka di file ini sebagai referensi

CATATAN: Angka ini adalah ESTIMASI. 
Selalu verifikasi dengan data slip gaji dan bukti potong resmi dari pemberi kerja.
  `.trim();
}
```

---

### Step 3 — Roadmap Bertahap Menuju PJAP (Jika Serius)

Ini bukan proses singkat, tapi berikut gambarannya:

| Tahap | Milestone | Estimasi |
|-------|-----------|----------|
| **Sekarang** | Benahi kualitas, pilih segmen, bangun kepercayaan | 0–6 bulan |
| **Fase 1** | Dapatkan pengguna aktif, validasi product-market fit | 6–12 bulan |
| **Fase 2** | Bentuk badan usaha resmi (PT), rekrut tim | 12–18 bulan |
| **Fase 3** | Daftar PJAP ke DJP, audit sistem keamanan | 18–24 bulan |
| **Fase 4** | Integrasi API resmi DJP (jika tersedia) | 24+ bulan |

**Syarat umum PJAP (berdasarkan PMK terkait):**
- Berbadan hukum PT yang berkedudukan di Indonesia
- Memiliki sistem keamanan informasi yang memenuhi standar (ISO 27001 atau setara)
- Bertanggung jawab atas keamanan data pengguna
- Perjanjian kerja sama dengan DJP

Untuk informasi terkini tentang persyaratan PJAP, cek:
- https://www.pajak.go.id/id/pjap
- PMK terbaru tentang layanan perpajakan elektronik

---

### Step 4 — Tentukan Model Bisnis

Tanpa model bisnis yang jelas, biaya Supabase + Gemini API akan membebani.

**Opsi yang umum untuk aplikasi sejenis:**

| Model | Cara Kerja | Cocok Jika |
|-------|-----------|------------|
| **Freemium** | Kalkulasi dasar gratis, fitur advanced berbayar | Ingin user base besar dulu |
| **Subscription** | Rp 30–50k/bulan untuk semua fitur | Sudah ada core feature yang benar-benar berguna |
| **B2B (ke perusahaan)** | Jual ke HRD/Payroll perusahaan kecil | Lebih mudah monetisasi dari B2C |
| **Iklan (tidak disarankan)** | Revenue dari iklan | Merusak kepercayaan di aplikasi finansial |

**Rekomendasi jangka pendek:** Tunda monetisasi. Validasi dulu bahwa pengguna mau kembali dan merekomendasikan ke orang lain. Monetisasi terlalu dini sebelum produk matang akan menghambat pertumbuhan.

---

## Prioritas Fitur Berdasarkan Dampak vs Usaha

```
Dampak Tinggi │ Mudah              │ Dampak Tinggi │ Sulit
──────────────┼────────────────────┼───────────────┼──────────────────
              │ ✅ Disclaimer kuat │               │ Export ke DJP
              │ ✅ 2 mode kalkulator│               │ Streak real
              │ ✅ Hapus SQL di UI │               │ Enkripsi NIK/NPWP
──────────────┼────────────────────┼───────────────┼──────────────────
Dampak Rendah │ Mudah              │ Dampak Rendah │ Sulit
──────────────┼────────────────────┼───────────────┼──────────────────
              │ Ubah label persona │               │ ❌ Fitur gamifikasi
              │ Tooltip glossary   │               │ ❌ CMS module dulu
```

---

## Checklist Perbaikan

- [ ] Identifikasi dan dokumentasikan "primary user persona" yang dipilih
- [ ] Semua fitur dievaluasi: relevan untuk primary user? Jika tidak, deprioritaskan
- [ ] Fitur export data (CSV/teks) untuk digunakan di DJP Online dibuat
- [ ] Halaman "Tentang Aplikasi" memuat disclaimer bahwa ini bukan PJAP resmi
- [ ] Model bisnis awal didokumentasikan (meski belum diimplementasi)
- [ ] Riset syarat PJAP dilakukan jika ada rencana serius ke sana

---

## Catatan Akhir

Aplikasi ini punya potensi nyata — masalah yang dipecahkan adalah masalah riil yang dihadapi jutaan karyawan Indonesia. Tapi untuk sampai ke sana, kuncinya adalah **fokus dan kepercayaan**, bukan fitur yang banyak.

Satu fitur yang bekerja sempurna lebih berharga dari sepuluh fitur yang setengah jadi.
