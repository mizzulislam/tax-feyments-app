# 07 — AI Agent Instructions for Antigravity IDE

Gunakan instruksi ini untuk AI coding agent saat memperbaiki Tax Feyments.

## Role

Anda adalah AI coding agent yang membantu mengoptimalkan Tax Feyments untuk event #JuaraVibeCoding.

## Goal

Perbaiki aplikasi agar mendapat nilai tinggi pada:

1. Problem — 30%
2. Solution — 40%
3. Uniqueness — 30%

Jangan sekadar menambah fitur. Bangun satu flow demo yang kuat, stabil, dan mudah dipahami.

## Product Direction

Tax Feyments adalah:

```text
Asisten persiapan pajak pribadi berbasis AI untuk Wajib Pajak Indonesia.
```

Tax Feyments bukan:

```text
Aplikasi resmi DJP
Pengganti Coretax
Pengganti konsultan pajak
Penerbit kode billing resmi
```

## Main Flow to Implement

```text
Landing Page
→ Start Tax Checkup
→ Persona Onboarding
→ Input/Load Demo Data
→ Dashboard with SPT Readiness Score
→ Missing Documents
→ AI Next Best Action
→ What-if Simulation
→ Export Tax Readiness Report PDF
```

## P0 Tasks

### 1. Landing Page

Implementasikan hero section, pain point cards, value proposition, CTA, dan disclaimer singkat.

### 2. Persona Onboarding

Buat flow pemilihan persona:

- Karyawan
- Freelancer
- UMKM
- Multi-income
- Belajar Pajak

Persona harus memengaruhi checklist dan next best action.

### 3. SPT Readiness Score

Buat utility function untuk menghitung readiness score dari data user.

Minimal output:

```ts
{
  score: number;
  health: 'Aman' | 'Perlu Perhatian' | 'Data Belum Lengkap' | 'Risiko Tinggi';
  completedItems: string[];
  missingItems: string[];
  nextActions: string[];
}
```

### 4. Dashboard

Dashboard harus menampilkan:

- readiness score;
- tax health badge;
- missing documents;
- next best action;
- estimated tax summary;
- AI insight card.

### 5. Demo Mode

Tambahkan tombol `Try Demo Data`.

Demo data:

```ts
{
  persona: ['employee', 'freelancer'],
  ptkpStatus: 'TK/0',
  annualSalary: 120000000,
  freelanceIncome: 36000000,
  documents: {
    taxpayerProfile: true,
    salaryIncome: true,
    withholdingSlip: false,
    assetList: false,
    freelanceInvoice: false
  }
}
```

### 6. AI Insight

Jika integrasi AI tersedia, gunakan data user untuk membuat insight. Jika tidak, buat fallback rule-based insight.

Insight tidak boleh mengklaim sebagai nasihat pajak final.

### 7. Tax Readiness Report PDF

PDF harus memuat:

- persona;
- readiness score;
- tax health;
- estimated tax;
- missing documents;
- next actions;
- AI insight;
- disclaimer.

## P1 Tasks

- OCR + manual verification.
- What-if simulation.
- Tax calculation breakdown.
- Root README update.
- Test cleanup.

## Coding Principles

- Prioritaskan user flow demo.
- Hindari perubahan besar yang tidak perlu.
- Jangan membuat UI terlalu ramai.
- Gunakan komponen existing jika ada.
- Pastikan mobile responsive.
- Pastikan semua output pajak diberi disclaimer.
- Jangan menyebut aplikasi sebagai sistem resmi.

## Definition of Done

Selesai jika user dapat:

1. membuka landing page;
2. memahami problem;
3. memilih persona;
4. mencoba demo data;
5. melihat readiness score;
6. membaca AI insight;
7. melihat missing documents;
8. menjalankan what-if sederhana;
9. export PDF report;
10. memahami bahwa output adalah estimasi/persiapan, bukan keputusan pajak resmi.
