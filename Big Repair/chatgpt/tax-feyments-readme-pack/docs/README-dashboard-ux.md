# Dashboard & UX Improvement

Dokumen ini menjelaskan perbaikan dashboard Tax Feyments agar tidak hanya terlihat menarik, tetapi benar-benar membantu pengguna mengambil tindakan pajak.

---

## Masalah Dashboard Pajak Umum

Dashboard aplikasi pajak sering terlalu fokus pada:

- grafik;
- total nominal;
- kartu statistik;
- visualisasi tren;
- tampilan modern.

Padahal pengguna pajak biasanya bertanya:

- Apakah data saya sudah lengkap?
- Apa yang belum saya isi?
- Apakah saya berpotensi kurang bayar?
- Dokumen apa yang perlu saya siapkan?
- Apa deadline terdekat?
- Apa langkah berikutnya?

---

## Prinsip Dashboard Baru

Dashboard Tax Feyments harus menjadi:

> **Action-oriented tax readiness dashboard.**

Bukan hanya analytics dashboard.

---

## Recommended Dashboard Hierarchy

### 1. SPT Readiness Score

Tampilkan skor kesiapan sebagai elemen utama.

Contoh:

```text
Kesiapan SPT Anda: 72%
Status: Hampir siap
```

### 2. Next Best Action

Tampilkan satu sampai tiga aksi paling penting.

Contoh:

```text
Langkah berikutnya:
1. Unggah bukti potong 1721-A1.
2. Lengkapi status PTKP.
3. Review penghasilan freelance yang belum memiliki bukti potong.
```

### 3. Missing Documents

Tampilkan dokumen yang belum lengkap.

### 4. Tax Estimate Summary

Tampilkan estimasi ringkas dengan disclaimer.

### 5. Risk Warnings

Tampilkan input yang berisiko salah, belum lengkap, atau perlu validasi.

### 6. Upcoming Deadlines

Tampilkan deadline yang relevan.

### 7. Charts

Grafik ditempatkan setelah informasi tindakan utama.

---

## UX Copy Guidelines

Gunakan bahasa yang jelas dan tidak menakut-nakuti.

Kurang baik:

```text
Data Anda salah.
```

Lebih baik:

```text
Data ini perlu ditinjau kembali karena dapat memengaruhi estimasi pajak.
```

Kurang baik:

```text
Pajak final Anda adalah Rp2.000.000.
```

Lebih baik:

```text
Estimasi pajak berdasarkan data saat ini adalah Rp2.000.000. Cocokkan kembali dengan dokumen resmi dan sistem DJP/Coretax.
```

---

## Empty State Design

Jika pengguna belum punya data, jangan tampilkan dashboard kosong.

Tampilkan onboarding steps:

1. Isi profil pajak.
2. Tambahkan sumber penghasilan.
3. Tambahkan dokumen.
4. Jalankan estimasi.
5. Lihat readiness score.

---

## Dashboard Components

Komponen yang disarankan:

- `ReadinessScoreCard`
- `NextBestActionCard`
- `MissingDocumentsList`
- `TaxEstimateCard`
- `RiskWarningPanel`
- `UpcomingDeadlineCard`
- `RecentActivityList`
- `IncomeBreakdownChart`

---

## Accessibility

Pastikan:

- teks cukup kontras;
- warning tidak hanya mengandalkan warna;
- tombol memiliki label jelas;
- form error mudah dipahami;
- nominal uang mudah dibaca;
- mobile layout tidak memotong informasi penting.

