# Tax Feyments

**Tax Feyments** adalah aplikasi web berbasis **Next.js, TypeScript, Supabase, dan AI-assisted workflow** yang dirancang sebagai **asisten persiapan pajak pribadi untuk Wajib Pajak Indonesia**.

Aplikasi ini membantu pengguna mencatat sumber penghasilan, menghitung estimasi pajak, mengelola dokumen pendukung, memahami risiko data pajak, serta menyiapkan ringkasan sebelum menggunakan sistem resmi DJP/Coretax.

> **Catatan penting:** Tax Feyments bukan aplikasi resmi Direktorat Jenderal Pajak, bukan pengganti Coretax/DJP Online, dan bukan pengganti konsultasi dengan konsultan pajak bersertifikat. Seluruh hasil perhitungan bersifat estimasi dan perlu diverifikasi kembali berdasarkan regulasi terbaru serta dokumen pajak resmi pengguna.

---

## 1. Problem Statement

Banyak Wajib Pajak Orang Pribadi dan pelaku UMKM kecil mengalami kesulitan dalam:

- memahami jenis pajak yang relevan dengan profil penghasilan mereka;
- mencatat penghasilan dari beberapa sumber;
- mengetahui dokumen apa saja yang perlu disiapkan sebelum pelaporan SPT;
- memperkirakan apakah mereka berpotensi kurang bayar atau lebih bayar;
- mengingat tenggat waktu pajak;
- memahami istilah perpajakan yang teknis;
- menyiapkan data sebelum masuk ke sistem resmi DJP/Coretax.

Tax Feyments hadir sebagai **pre-filing assistant**, yaitu alat bantu sebelum proses pelaporan resmi dilakukan.

---

## 2. Product Positioning

Tax Feyments diposisikan sebagai:

> **Personal Tax Preparation Assistant for Indonesian Taxpayers**  
> Asisten persiapan pajak pribadi untuk membantu Wajib Pajak Indonesia mencatat data, menghitung estimasi, memahami kewajiban, dan mempersiapkan dokumen sebelum pelaporan resmi.

Tax Feyments **tidak** diposisikan sebagai:

- sistem pelaporan resmi pajak;
- aplikasi penerbit kode billing resmi;
- konsultan pajak otomatis;
- pengganti Coretax/DJP Online;
- alat untuk menghindari kewajiban pajak.

---

## 3. Target Users

### Primary User

**Wajib Pajak Orang Pribadi non-ahli pajak**, terutama:

- karyawan yang ingin memahami PPh 21 dan bukti potong;
- freelancer yang memiliki penghasilan tidak tetap;
- pemilik UMKM kecil yang ingin mencatat omzet dan estimasi pajak;
- individu dengan beberapa sumber penghasilan;
- mahasiswa atau fresh graduate yang ingin belajar praktik pajak pribadi.

### Secondary User

- konsultan pajak yang ingin memberi edukasi awal kepada klien;
- dosen/penguji yang menilai proyek tax-tech;
- recruiter/technical reviewer yang menilai portofolio full-stack berbasis domain riil.

---

## 4. Core Features

### 4.1 Taxpayer Profile

Pengguna dapat mengelola profil dasar perpajakan seperti:

- status Wajib Pajak;
- status PTKP;
- jenis pekerjaan;
- sumber penghasilan;
- kepemilikan aset;
- preferensi tahun pajak.

### 4.2 Income Source Management

Pengguna dapat mencatat beberapa jenis sumber penghasilan, misalnya:

- gaji sebagai karyawan;
- freelance/project-based income;
- penghasilan usaha/UMKM;
- penghasilan lain-lain.

### 4.3 Tax Calculator

Aplikasi menyediakan kalkulator estimasi pajak berbasis skenario, seperti:

- estimasi PPh 21 karyawan;
- estimasi pajak atas penghasilan freelance;
- estimasi pajak UMKM;
- simulasi akhir tahun;
- skenario gabungan beberapa sumber penghasilan.

Setiap hasil kalkulasi harus menampilkan:

- input yang digunakan;
- asumsi perhitungan;
- rumus ringkas;
- dasar regulasi;
- status hasil: estimasi/final/perlu validasi;
- catatan risiko.

### 4.4 SPT Readiness Dashboard

Dashboard tidak hanya menampilkan grafik, tetapi membantu pengguna memahami:

- skor kesiapan SPT;
- dokumen yang belum lengkap;
- data yang masih ambigu;
- estimasi kurang bayar/lebih bayar;
- deadline terdekat;
- langkah berikutnya.

### 4.5 Document Checklist

Pengguna dapat melacak dokumen pendukung seperti:

- bukti potong 1721-A1/A2;
- rekap penghasilan freelance;
- rekap omzet UMKM;
- daftar aset;
- dokumen biaya;
- bukti pembayaran pajak.

### 4.6 Tax Calendar

Kalender pajak membantu pengguna mengingat:

- deadline pelaporan;
- deadline pembayaran;
- agenda persiapan SPT;
- pengingat dokumen yang belum lengkap.

### 4.7 Tax Assistant

AI assistant digunakan secara terbatas untuk:

- membantu edukasi istilah pajak;
- menjelaskan hasil perhitungan;
- membuat checklist data yang kurang;
- memberi peringatan atas input yang tidak lengkap.

AI assistant tidak boleh memberikan nasihat pajak final tanpa disclaimer dan tidak boleh menggantikan validasi profesional.

### 4.8 PDF Export

Pengguna dapat mengekspor ringkasan:

- profil pajak;
- daftar penghasilan;
- estimasi pajak;
- dokumen yang sudah/belum lengkap;
- catatan asumsi;
- catatan risiko.

Output ini ditujukan untuk membantu persiapan, bukan sebagai dokumen resmi pelaporan pajak.

---

## 5. Tech Stack

- **Framework:** Next.js
- **Language:** TypeScript
- **UI:** React
- **Backend/Database:** Supabase
- **State Management:** Zustand / React Context
- **Data Fetching:** React Query
- **Validation:** Zod / React Hook Form
- **Charts:** Recharts
- **PDF Generation:** jsPDF
- **AI Integration:** Google Generative AI
- **Security:** Supabase RLS, API authorization, security headers

---

## 6. Recommended Documentation Structure

Dokumentasi lanjutan tersedia di folder `/docs`:

| File | Purpose |
|---|---|
| [`docs/README-product-positioning.md`](docs/README-product-positioning.md) | Menjelaskan positioning produk dan batasan aplikasi |
| [`docs/README-tax-scope.md`](docs/README-tax-scope.md) | Menjelaskan cakupan pajak yang didukung |
| [`docs/README-mvp-scope.md`](docs/README-mvp-scope.md) | Menentukan fitur MVP dan fitur yang ditunda |
| [`docs/README-spt-readiness.md`](docs/README-spt-readiness.md) | Merancang fitur SPT readiness score |
| [`docs/README-tax-calculation.md`](docs/README-tax-calculation.md) | Standar tax engine dan breakdown perhitungan |
| [`docs/README-ai-policy.md`](docs/README-ai-policy.md) | Guardrail AI assistant |
| [`docs/README-security-privacy.md`](docs/README-security-privacy.md) | Keamanan, privasi, RLS, dan data sensitif |
| [`docs/README-dashboard-ux.md`](docs/README-dashboard-ux.md) | Perbaikan dashboard agar action-oriented |
| [`docs/README-documents-ocr.md`](docs/README-documents-ocr.md) | Kebijakan dokumen dan OCR |
| [`docs/README-billing.md`](docs/README-billing.md) | Batasan fitur billing/simulasi pembayaran |
| [`docs/README-admin-rbac.md`](docs/README-admin-rbac.md) | Role-based access control dan audit log |
| [`docs/README-roadmap.md`](docs/README-roadmap.md) | Roadmap perbaikan 30/60/90 hari |

---

## 7. Legal & Tax Disclaimer

Tax Feyments dibuat untuk tujuan edukasi, pencatatan, simulasi, dan persiapan pelaporan. Aplikasi ini:

- bukan aplikasi resmi DJP;
- tidak menerbitkan dokumen pajak resmi;
- tidak menjamin hasil perhitungan sebagai nilai final;
- tidak menggantikan konsultan pajak;
- tidak boleh digunakan untuk menghindari kewajiban perpajakan.

Pengguna tetap bertanggung jawab memverifikasi seluruh data dan hasil perhitungan melalui regulasi terbaru, dokumen resmi, konsultan pajak, atau sistem resmi DJP/Coretax.

---

## 8. Development Setup

```bash
npm install
npm run dev
```

Buka aplikasi di:

```text
http://localhost:3000
```

Tambahkan file `.env.local` berdasarkan kebutuhan Supabase, AI provider, dan konfigurasi aplikasi.

---

## 9. Testing

Jalankan test dengan:

```bash
npm test
```

Area test yang disarankan:

- tax engine calculation;
- API authorization;
- Supabase RLS policy;
- security headers;
- PDF report generation;
- input validation;
- AI guardrail behavior.

---

## 10. Improvement Philosophy

Prioritas pengembangan Tax Feyments bukan memperbanyak fitur, tetapi meningkatkan:

1. akurasi;
2. kejelasan asumsi;
3. relevansi terhadap proses pajak nyata;
4. keamanan data;
5. kesiapan pengguna sebelum lapor pajak;
6. kepercayaan pengguna terhadap hasil aplikasi.

