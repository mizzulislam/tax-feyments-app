# MVP Scope Recommendation

Dokumen ini menentukan fitur yang sebaiknya diprioritaskan, ditunda, atau dibuang dari MVP Tax Feyments agar aplikasi lebih fokus dan layak digunakan.

---

## Prinsip MVP

MVP Tax Feyments tidak perlu menjadi aplikasi pajak serba bisa. MVP harus membuktikan satu hal utama:

> Pengguna dapat mencatat data pajak pribadi, menghitung estimasi awal, mengetahui dokumen yang kurang, dan lebih siap sebelum pelaporan resmi.

---

## MVP Core Flow

Alur utama MVP:

1. Pengguna membuat akun.
2. Pengguna mengisi profil pajak dasar.
3. Pengguna mencatat sumber penghasilan.
4. Pengguna melihat estimasi pajak.
5. Pengguna melihat dokumen yang perlu disiapkan.
6. Pengguna melihat readiness score.
7. Pengguna mengekspor ringkasan persiapan pajak.

---

## Fitur yang Harus Dipertahankan

### 1. Authentication

Wajib ada untuk melindungi data pribadi pengguna.

### 2. Taxpayer Profile

Profil pajak adalah dasar semua kalkulasi.

### 3. Income Source Management

Ini fitur inti karena pajak dimulai dari sumber penghasilan.

### 4. Tax Calculator

Tetap dipertahankan, tetapi harus berbasis skenario dan menampilkan breakdown.

### 5. SPT Readiness Dashboard

Ini bisa menjadi pembeda utama Tax Feyments.

### 6. Document Checklist

Lebih berguna daripada sekadar file storage.

### 7. Tax Calendar

Berguna untuk reminder dan edukasi deadline.

### 8. PDF Export

Berguna untuk portofolio produk dan kebutuhan praktis pengguna.

---

## Fitur yang Sebaiknya Ditunda

### 1. Advanced Analytics

Grafik kompleks tidak penting jika data pajak pengguna belum lengkap.

### 2. Gamification

Streak, badge, atau poin bisa terasa tidak relevan untuk domain pajak yang serius.

### 3. Admin Panel Kompleks

Admin panel perlu desain keamanan yang matang. Jangan jadikan prioritas awal jika belum ada kebutuhan operasional.

### 4. Consultant Role

Role konsultan membutuhkan permission, consent, dan audit trail yang kuat.

### 5. Full OCR Automation

OCR pajak rawan salah. MVP cukup document upload + checklist + manual verification.

### 6. AI Chat Bebas

AI bebas berisiko halusinasi. Gunakan AI untuk penjelasan terbatas dan checklist.

### 7. Official Billing-like Feature

Jangan membuat pengguna mengira aplikasi menerbitkan kode billing resmi.

---

## MVP Feature Priority

| Priority | Feature | Reason |
|---|---|---|
| P0 | Taxpayer profile | Fondasi semua kalkulasi |
| P0 | Income source input | Data utama pajak |
| P0 | Calculation breakdown | Meningkatkan trust |
| P0 | Tax disclaimer | Mengurangi risiko misleading |
| P1 | SPT readiness score | Nilai unik aplikasi |
| P1 | Document checklist | Sangat relevan untuk pelaporan |
| P1 | PDF export | Output praktis |
| P2 | AI explanation assistant | Berguna jika dibatasi |
| P2 | Calendar reminder | Tambahan nilai praktis |
| P3 | Analytics | Setelah data matang |
| P3 | OCR | Setelah pipeline validasi siap |

---

## MVP Anti-Goals

MVP tidak bertujuan untuk:

- menggantikan Coretax;
- melaporkan SPT secara resmi;
- menerbitkan kode billing resmi;
- memberi nasihat pajak final;
- menangani pajak perusahaan kompleks;
- menangani sengketa pajak;
- mengotomatisasi semua proses pajak.

---

## Definition of Done

MVP dianggap layak jika:

- pengguna dapat menyelesaikan onboarding dalam kurang dari 5 menit;
- pengguna dapat mencatat minimal satu sumber penghasilan;
- pengguna mendapatkan estimasi dengan breakdown;
- pengguna memahami asumsi perhitungan;
- pengguna melihat dokumen yang masih kurang;
- pengguna dapat mengekspor ringkasan;
- setiap halaman sensitif memiliki disclaimer yang jelas.

