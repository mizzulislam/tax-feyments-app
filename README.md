# Tax Feyments — Juara Vibe Coding Optimization README

Tax Feyments adalah **asisten persiapan pajak pribadi berbasis AI untuk Wajib Pajak Indonesia**. Aplikasi ini membantu pengguna memahami kewajiban pajaknya, mengecek kesiapan SPT, menyiapkan dokumen, menghitung estimasi pajak, dan membuat ringkasan siap pakai sebelum masuk ke sistem resmi DJP/Coretax.

> Status penting: Tax Feyments bukan aplikasi resmi DJP, bukan pengganti Coretax/DJP Online, bukan pengganti konsultan pajak bersertifikat, dan tidak menerbitkan kode billing resmi. Aplikasi ini berperan sebagai **pre-filing assistant**.

---

## 1. Tujuan Optimasi

README ini dibuat sebagai panduan implementasi cepat agar Tax Feyments lebih kuat untuk event **#JuaraVibeCoding** berdasarkan tiga kriteria utama:

| Kriteria | Bobot | Target Tax Feyments |
|---|---:|---|
| Problem | 30% | Menyelesaikan masalah nyata wajib pajak pribadi Indonesia yang bingung menyiapkan pajak, dokumen, deadline, dan estimasi kewajiban |
| Solution | 40% | Memberikan flow aplikasi yang fungsional, profesional, mudah digunakan, dan menghasilkan output nyata berupa Tax Readiness Report |
| Uniqueness | 30% | Memakai AI secara elegan melalui Tax Readiness Assistant, OCR + verifikasi manual, readiness score, next best action, dan what-if simulation |

Fokus utama bukan menambah banyak fitur, tetapi membuat satu alur pengguna yang kuat, jelas, dan mudah didemokan dalam 2–3 menit.

---

## 2. Product Positioning

### One-liner

**Tax Feyments membantu karyawan, freelancer, dan UMKM kecil menyiapkan data pajak pribadi secara lebih rapi, terarah, dan percaya diri sebelum lapor melalui sistem resmi DJP/Coretax.**

### Elevator Pitch

Banyak wajib pajak pribadi memiliki data pajak yang tersebar: gaji, penghasilan freelance, omzet UMKM, bukti potong, aset, dokumen pendukung, dan deadline pelaporan. Tax Feyments mengubah data tersebut menjadi checklist kesiapan SPT, estimasi pajak, rekomendasi AI, dan laporan ringkas yang siap digunakan sebagai panduan sebelum masuk ke sistem resmi.

### Target User Utama

1. Karyawan yang ingin memahami PPh 21 dan kesiapan SPT.
2. Freelancer yang memiliki penghasilan tambahan dan perlu mencatat dokumen pendukung.
3. Pelaku UMKM kecil yang perlu memahami estimasi pajak dan status dokumen.
4. Wajib pajak pribadi dengan beberapa sumber penghasilan.

---

## 3. Problem Statement

Wajib Pajak Orang Pribadi di Indonesia sering menghadapi masalah berikut:

- Tidak tahu dokumen apa saja yang harus disiapkan sebelum lapor SPT.
- Bingung membedakan penghasilan gaji, freelance, usaha, dan penghasilan lain.
- Tidak memahami apakah data pajaknya sudah lengkap atau masih berisiko.
- Takut salah hitung karena kalkulator pajak sering hanya menampilkan angka akhir tanpa asumsi.
- Lupa deadline pelaporan dan pembayaran.
- Sulit membaca bukti potong, invoice, atau dokumen pendukung.
- Tidak tahu langkah berikutnya setelah melihat hasil perhitungan pajak.

Tax Feyments harus menjawab masalah ini dengan satu alur utama:

```text
Onboarding persona
→ Input data pajak
→ Upload/verifikasi dokumen
→ Hitung readiness score
→ AI memberi next best action
→ Export Tax Readiness Report
```

---

## 4. Main Value Proposition

Tax Feyments tidak hanya menghitung pajak. Tax Feyments membantu pengguna menjawab pertanyaan:

1. Apakah data pajak saya sudah lengkap?
2. Dokumen apa yang masih kurang?
3. Estimasi pajak saya berapa?
4. Apa asumsi dan dasar perhitungannya?
5. Apa risiko terbesar dari data saya?
6. Apa langkah berikutnya sebelum lapor SPT?
7. Apa ringkasan yang bisa saya bawa saat masuk ke Coretax/DJP atau konsultasi pajak?

---

## 5. Core Features untuk Nilai Tertinggi

### 5.1 SPT Readiness Score

Fitur pusat aplikasi. Dashboard harus menampilkan skor kesiapan SPT pengguna.

Contoh output:

```text
SPT Readiness: 72%

Lengkap:
- Profil wajib pajak
- Status PTKP
- Data penghasilan utama

Belum lengkap:
- Bukti potong 1721-A1
- Daftar aset
- Rekap penghasilan freelance
- Konfirmasi status UMKM final/non-final
```

Readiness score harus dihitung dari:

- kelengkapan profil wajib pajak
- status PTKP
- sumber penghasilan
- dokumen pendukung
- aset
- transaksi/penghasilan tambahan
- validasi asumsi perhitungan
- deadline dan status aktivitas pajak

### 5.2 Next Best Action

Aplikasi harus memberi rekomendasi langkah berikutnya.

Contoh:

```text
Langkah berikutnya:
1. Upload bukti potong dari pemberi kerja.
2. Lengkapi daftar aset kendaraan/properti.
3. Tandai apakah penghasilan freelance sudah dipotong pajak.
4. Review estimasi kurang/lebih bayar.
```

### 5.3 AI Tax Readiness Assistant

AI tidak boleh hanya menjadi chatbot teori pajak. AI harus membaca data pengguna dan memberi insight personal.

Contoh:

```text
AI Insight:
Anda memiliki 2 sumber penghasilan, tetapi baru 1 yang memiliki dokumen pendukung. Estimasi pajak dapat berubah jika penghasilan freelance belum dikategorikan. Lengkapi rekap invoice atau bukti pembayaran sebelum membuat Tax Readiness Report.
```

### 5.4 OCR + Manual Verification

OCR boleh digunakan untuk membantu membaca bukti potong/invoice, tetapi hasilnya tidak boleh langsung dianggap benar.

Flow wajib:

```text
Upload dokumen
→ Extract data
→ Tampilkan confidence/hasil ekstraksi
→ User verifikasi manual
→ User klik Apply/Save
→ Data masuk ke readiness score
```

### 5.5 Tax Calculation Breakdown

Setiap hasil kalkulasi wajib menampilkan:

- jenis pajak
- tahun pajak
- input yang dipakai
- status PTKP
- bruto/neto
- pengurang
- PKP/DPP jika relevan
- tarif
- hasil estimasi
- asumsi
- disclaimer

### 5.6 Tax Readiness Report PDF

Output akhir yang harus bisa diekspor.

Isi minimal PDF:

- profil wajib pajak
- ringkasan sumber penghasilan
- estimasi pajak
- breakdown perhitungan
- readiness score
- dokumen lengkap dan belum lengkap
- next best action
- AI insight
- disclaimer

### 5.7 What-if Simulation

Fitur pembeda untuk nilai uniqueness.

Contoh simulasi:

- Jika penghasilan freelance naik 20%, pajak berubah bagaimana?
- Jika dokumen bukti potong belum tersedia, readiness score turun berapa?
- Jika omzet UMKM bertambah, status risiko berubah bagaimana?

---

## 6. Landing Page Requirements

Landing page harus menjelaskan masalah dalam 10 detik.

### Hero Copy

```text
Siapkan pajak pribadi Anda dengan lebih rapi sebelum lapor.

Tax Feyments membantu karyawan, freelancer, dan UMKM kecil mengecek kesiapan SPT, menghitung estimasi pajak, mengelola dokumen, dan mendapatkan rekomendasi AI sebelum masuk ke sistem resmi DJP/Coretax.
```

### CTA

```text
Mulai Tax Checkup
Lihat Demo
```

### Pain Point Cards

| Masalah | Solusi Tax Feyments |
|---|---|
| Bingung dokumen pajak apa yang dibutuhkan | SPT Readiness Checklist |
| Tidak tahu pajak kurang/lebih bayar | Estimasi pajak + breakdown |
| Data penghasilan tersebar | Income source tracking |
| Takut salah input dokumen | OCR + manual verification |
| Tidak tahu langkah berikutnya | AI Next Best Action |
| Perlu ringkasan sebelum lapor | Tax Readiness Report PDF |

---

## 7. Dashboard Requirements

Dashboard harus action-based, bukan hanya analytics-based.

Urutan komponen dashboard yang disarankan:

1. SPT Readiness Score Card
2. Tax Health Badge
3. Next Best Action
4. Estimated Tax Summary
5. Missing Documents
6. Upcoming Deadlines
7. AI Tax Insight
8. Recent Tax Activity
9. Optional: charts/trends

### Tax Health Badge

```text
Aman
Perlu Perhatian
Data Belum Lengkap
Risiko Tinggi
```

Badge dihitung berdasarkan readiness score, dokumen, dan validasi data.

---

## 8. AI Safety Requirements

AI harus diposisikan sebagai:

```text
Asisten Edukasi dan Persiapan Pajak
```

Bukan:

```text
Konsultan Pajak Final
Tax Advisor Resmi
Pengganti DJP/Konsultan
```

### AI harus selalu:

- menyebut bahwa jawaban bersifat edukatif dan persiapan
- menggunakan data pengguna hanya jika user memberi izin
- memberi rekomendasi berbasis data aplikasi
- mengarahkan ke sistem resmi/konsultan untuk kasus kompleks
- menolak membantu penghindaran pajak ilegal
- menampilkan disclaimer di hasil AI

### Prompt System AI yang Disarankan

```text
Anda adalah Asisten Edukasi dan Persiapan Pajak untuk aplikasi Tax Feyments. Tugas Anda membantu pengguna memahami data pajaknya, menemukan kekurangan dokumen, menjelaskan estimasi pajak, dan memberi langkah berikutnya sebelum menggunakan sistem resmi DJP/Coretax. Jangan mengklaim sebagai konsultan pajak bersertifikat. Jangan memberikan keputusan pajak final. Selalu jelaskan asumsi dan sarankan verifikasi ke sistem resmi atau profesional pajak untuk kasus kompleks.
```

---

## 9. Billing Boundary Requirements

Tax Feyments tidak boleh terlihat seperti menerbitkan kode billing resmi.

Gunakan istilah:

- Draft Pembayaran
- Panduan e-Billing
- Simulasi Data Pembayaran
- Ringkasan untuk Pengisian Coretax/DJP

Hindari istilah yang menyesatkan:

- Kode billing resmi
- Pembayaran berhasil
- Pajak lunas
- Terhubung ke DJP

Setiap halaman billing harus mencantumkan:

```text
Tax Feyments tidak menerbitkan kode billing resmi dan tidak menerima pembayaran pajak. Gunakan data ini sebagai panduan sebelum membuat billing melalui sistem resmi DJP/Coretax atau kanal pembayaran resmi.
```

---

## 10. UX Demo Flow untuk Event

Aplikasi harus bisa didemokan dalam 2–3 menit dengan flow berikut:

```text
Landing Page
→ Start Tax Checkup
→ Pilih persona: Karyawan + Freelancer
→ Input penghasilan
→ Upload dokumen
→ Verifikasi hasil OCR
→ Lihat SPT Readiness Score
→ Baca AI Insight
→ Jalankan What-if Simulation
→ Export Tax Readiness Report
```

Jangan memaksa juri membuat data dari nol. Sediakan demo mode/sample data.

---

## 11. Demo Mode Requirements

Tambahkan tombol:

```text
Try Demo Data
```

Demo data minimal:

```text
Nama: Demo User
Persona: Karyawan + Freelancer
Status PTKP: TK/0
Penghasilan gaji: Rp120.000.000/tahun
Penghasilan freelance: Rp36.000.000/tahun
Dokumen lengkap: profil, penghasilan utama
Dokumen kurang: bukti potong, daftar aset, rekap invoice freelance
Readiness score: 72%
Tax health: Perlu Perhatian
```

Demo mode sangat penting agar video dan penilaian juri tidak terganggu oleh setup data.

---

## 12. Implementation Priorities

### P0 — Harus selesai hari ini

- [ ] Landing page dengan problem statement jelas
- [ ] Onboarding persona
- [ ] Dashboard menampilkan SPT Readiness Score
- [ ] Next Best Action
- [ ] AI Insight berdasarkan data user/demo data
- [ ] Tax Readiness Report PDF
- [ ] Demo mode/sample data
- [ ] Disclaimer di kalkulator, AI, billing, dan PDF

### P1 — Sangat disarankan

- [ ] OCR + manual verification
- [ ] What-if simulation
- [ ] Tax health badge
- [ ] Breakdown kalkulasi pajak
- [ ] Semua test tax engine hijau
- [ ] README root profesional

### P2 — Bonus

- [ ] Gamification ringan
- [ ] Tutorial interaktif
- [ ] Multi-year tracking
- [ ] Consultant access dengan permission granular

---

## 13. Acceptance Criteria

Aplikasi dianggap siap submit jika:

- [ ] User baru memahami manfaat aplikasi dalam 10 detik.
- [ ] User bisa memilih persona pajak.
- [ ] User melihat readiness score yang mudah dipahami.
- [ ] User mendapat daftar dokumen kurang.
- [ ] User mendapat next best action.
- [ ] User bisa melihat estimasi pajak dengan breakdown.
- [ ] AI memberi insight yang spesifik terhadap data user.
- [ ] OCR tidak auto-save tanpa verifikasi.
- [ ] Billing jelas hanya draft/panduan, bukan resmi.
- [ ] PDF report bisa diekspor.
- [ ] Ada demo data untuk juri.
- [ ] Aplikasi live di Cloud Run atau Google AI Studio.
- [ ] Video demo 2–3 menit bisa diakses publik di LinkedIn.
- [ ] Post memakai hashtag #JuaraVibeCoding.

---

## 14. Recommended File Structure

```text
README.md
AGENTS.md
/docs
  /juara-vibe-coding
    README.md
    01-problem.md
    02-solution.md
    03-uniqueness.md
    04-implementation-priority.md
    05-demo-script.md
    06-acceptance-criteria.md
    07-ai-agent-instructions.md
```

---

## 15. Instruction for AI Coding Agent

Saat memperbaiki aplikasi, prioritaskan perubahan yang menaikkan skor event. Jangan menambah fitur yang tidak mendukung demo utama. Fokus pada flow:

```text
problem clarity → guided onboarding → readiness dashboard → AI insight → report export
```

Setiap perubahan harus memperkuat minimal satu dari tiga kriteria penilaian:

1. Problem: apakah target audiens dan masalahnya makin jelas?
2. Solution: apakah aplikasi makin fungsional, profesional, mudah digunakan, dan menghasilkan output nyata?
3. Uniqueness: apakah AI/fitur kreatif digunakan secara elegan dan tidak generik?

