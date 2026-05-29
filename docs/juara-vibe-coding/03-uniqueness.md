# 03 — Uniqueness Optimization

## Rubric

Uniqueness bernilai 30%. Juri mencari orisinalitas, perspektif segar, dan wow factor dari penggunaan AI.

## Prinsip

AI jangan menjadi chatbot tempelan. AI harus terasa memahami kondisi pajak pengguna.

## Fitur Unik Utama

### 1. AI Tax Readiness Assistant

AI membaca data user dan menjawab:

- Apa yang masih kurang?
- Mengapa readiness score belum 100%?
- Risiko data pajak saya apa?
- Apa langkah berikutnya?

Contoh jawaban:

```text
Anda memiliki penghasilan gaji dan freelance, tetapi baru penghasilan gaji yang memiliki dokumen pendukung. Lengkapi rekap invoice freelance agar estimasi pajak akhir tahun lebih akurat.
```

### 2. Ask My Tax Data

Tambahkan prompt cepat:

- Apakah saya sudah siap lapor?
- Dokumen apa yang kurang?
- Apa risiko terbesar dari data saya?
- Bagaimana jika penghasilan freelance saya naik 20%?

### 3. OCR + Manual Verification

OCR digunakan untuk efek wow, tetapi aman karena user tetap memverifikasi.

Flow:

```text
Upload → Extract → Review → Confirm → Save
```

### 4. What-if Simulation

Simulasi cepat:

- income naik/turun;
- dokumen belum lengkap;
- UMKM vs freelance;
- readiness sebelum/sesudah dokumen diunggah.

### 5. Tax Health Badge

Badge:

- Aman
- Perlu Perhatian
- Data Belum Lengkap
- Risiko Tinggi

## Acceptance Criteria

- [ ] AI memberi insight berbasis data, bukan teori umum saja.
- [ ] Ada quick prompts untuk Ask My Tax Data.
- [ ] OCR tidak auto-save.
- [ ] Ada what-if simulation sederhana.
- [ ] Ada tax health badge yang terlihat di dashboard.
