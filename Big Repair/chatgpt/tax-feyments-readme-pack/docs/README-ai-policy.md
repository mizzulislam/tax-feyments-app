# AI Assistant Policy & Guardrails

Dokumen ini menjelaskan perbaikan fitur AI Tax Assistant agar aman, relevan, dan tidak menyesatkan pengguna dalam konteks perpajakan.

---

## Masalah Utama

AI dalam aplikasi pajak sangat berisiko jika digunakan sebagai chatbot bebas.

Risiko utama:

- halusinasi regulasi;
- jawaban terlalu percaya diri;
- informasi pajak tidak terbaru;
- pengguna mengira AI adalah konsultan pajak resmi;
- data sensitif dikirim ke model tanpa persetujuan;
- AI memberi saran yang tidak sesuai hukum;
- AI gagal memahami konteks dokumen pengguna.

---

## Repositioning

Hindari menyebut AI sebagai:

```text
Taxologist otomatis
Konsultan pajak AI
Ahli pajak virtual
```

Gunakan istilah yang lebih aman:

```text
Asisten Edukasi Pajak
Tax Preparation Assistant
AI Tax Helper
Tax Readiness Assistant
```

---

## Allowed AI Use Cases

AI boleh digunakan untuk:

- menjelaskan istilah pajak;
- menjelaskan hasil perhitungan yang sudah dibuat tax engine;
- membuat checklist data yang kurang;
- membantu pengguna memahami dokumen yang perlu disiapkan;
- merangkum input pengguna;
- memberi pertanyaan klarifikasi;
- membuat panduan langkah berikutnya.

---

## Restricted AI Use Cases

AI tidak boleh:

- memberikan nasihat pajak final;
- mengklaim hasil pasti benar;
- membuat strategi penghindaran pajak;
- menyarankan manipulasi dokumen;
- mengabaikan regulasi;
- mengakses data sensitif tanpa consent;
- menjawab kasus kompleks tanpa menyarankan validasi profesional;
- berpura-pura menjadi sistem resmi DJP.

---

## Mandatory AI Disclaimer

Setiap fitur AI harus menampilkan disclaimer:

```text
Jawaban AI bersifat edukatif dan membantu persiapan data. Jawaban ini bukan nasihat pajak final dan perlu diverifikasi dengan regulasi terbaru, dokumen resmi, sistem DJP/Coretax, atau konsultan pajak.
```

---

## Consent Requirement

Sebelum pengguna memakai AI pada data pribadi, tampilkan persetujuan:

```text
Dengan menggunakan fitur AI, Anda memahami bahwa sebagian data yang Anda pilih dapat diproses untuk menghasilkan penjelasan atau checklist. Jangan unggah data yang tidak ingin Anda proses melalui fitur AI.
```

Pengguna harus dapat memilih:

- gunakan data profil;
- gunakan data penghasilan;
- gunakan dokumen;
- gunakan hasil kalkulasi;
- jangan gunakan data pribadi.

---

## Recommended AI Features

### 1. Missing Data Checker

AI membaca struktur data pengguna dan menghasilkan daftar kekurangan.

Output contoh:

```text
Data yang perlu dilengkapi:
1. Status PTKP belum diisi.
2. Bukti potong untuk penghasilan karyawan belum tersedia.
3. Penghasilan freelance belum ditandai sudah/belum dipotong pajak.
```

### 2. Calculation Explainer

AI hanya menjelaskan hasil dari tax engine, bukan menghitung sendiri.

### 3. Tax Glossary Assistant

AI menjelaskan istilah pajak dengan bahasa sederhana.

### 4. Next Step Assistant

AI memberi langkah lanjutan berdasarkan readiness score.

---

## Prompt Guardrail Template

```text
Anda adalah asisten edukasi pajak untuk aplikasi Tax Feyments.
Anda membantu pengguna memahami istilah, asumsi, checklist, dan hasil estimasi pajak.
Anda bukan konsultan pajak resmi.
Anda tidak boleh mengklaim jawaban sebagai nasihat pajak final.
Anda tidak boleh memberikan strategi penghindaran pajak.
Jika data tidak lengkap, minta pengguna melengkapi data atau sarankan verifikasi profesional.
Gunakan konteks yang tersedia dan nyatakan asumsi dengan jelas.
```

---

## UI Safety Requirements

Fitur AI harus memiliki:

- label “Beta/Edukasi”;
- disclaimer tetap terlihat;
- tombol “lihat data yang digunakan AI”;
- opsi hapus riwayat chat;
- opsi tidak menggunakan data pribadi;
- fallback jika AI tidak yakin.

