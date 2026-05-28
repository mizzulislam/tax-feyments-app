# **🏛️ Panduan Master Restrukturisasi Arsitektur — My Tax**

Dokumen ini merupakan cetak biru (blueprint) utama untuk melakukan refaktorisasi mendalam pada sistem aplikasi **My Tax** (v2.0.26+). Restrukturisasi ini bertujuan untuk menyelaraskan logika aplikasi dengan hukum perpajakan Indonesia (UU HPP / PP 55), memperkuat keamanan data finansial wajib pajak (UU PDP), serta meningkatkan kegunaan fitur simulasi.

## **🚨 Mengapa Restrukturisasi Ini Mutlak Diperlukan?**

Berdasarkan tinjauan arsitektur mendalam terhadap fase MVP saat ini, ditemukan 3 celah kritis (*critical vulnerabilities*) yang dapat berisiko hukum bagi pengguna maupun penyedia platform:

1. **Ketidakpatuhan Logika Konsolidasi Pajak (UU HPP):**  
   * *Masalah:* Sistem memperbolehkan wajib pajak yang memiliki penghasilan dari **Pekerjaan Bebas** (dokter, konsultan, freelancer profesional) untuk menghitung omzet usaha dagangnya menggunakan skema PPh Final UMKM PP 23 (0.5%).  
   * *Risiko:* Secara hukum perpajakan Indonesia, hal ini **tidak sah**. Seluruh penghasilan wajib dikonsolidasikan ke tarif progresif Pasal 17 menggunakan NPPN atau Pembukuan.  
2. **Pelanggaran Kerahasiaan Data Identitas Wajib Pajak (UU PDP):**  
   * *Masalah:* Kolom pengenal sensitif seperti NIK dan NPWP disimpan dalam bentuk teks mentah (*raw text*) di database dan dirender telanjang pada Admin Panel.  
   * *Risiko:* Kebocoran data internal akan langsung mengekspos identitas keuangan pengguna secara ilegal, melanggar hak privasi data pribadi.  
3. **Fitur Simulasi "What-If" yang Pasif:**  
   * *Masalah:* Simulator hanya memproses hitung-hitungan angka di tempat tanpa memberikan interpretasi regulasi atau panduan taktis untuk meminimalkan beban pajak secara legal.  
   * *Risiko:* Pengguna tidak mendapatkan nilai guna (*utility value*) nyata dari simulasi yang dilakukan selain dari sekadar melihat angka berubah.

## **📂 Struktur Berkas Panduan Perbaikan Khusus**

Proses perbaikan telah dibagi secara modular ke dalam 3 dokumen teknis mandiri yang diletakkan pada folder docs/:

| Nama Berkas | Target Implementasi | Deskripsi Fokus |
| :---- | :---- | :---- |
| **[README-Engine.md](http://docs.google.com/README-Engine.md)** | src/lib/taxEngine.ts | Refaktorisasi logika kalkulasi, penanganan batas waktu 7 tahun PPh UMKM, penguncian eksklusivitas kategori penghasilan, dan optimasi perhitungan masa pajak Desember. |
| [**README-Security.md**](http://docs.google.com/README-Security.md) | PostgreSQL DDL & src/components/admin/MaskedTaxData.tsx | Penerapan Enkripsi *At-Rest* (PGP Symmetric) pada Supabase Database dan masking visual data wajib pajak di tingkat UI Admin Panel. |
| [**README-Simulator.md**](http://docs.google.com/README-Simulator.md) | src/components/whatif/ScenarioComparisonCard.tsx | Integrasi komponen *Tax Optimization Advisor* berbasis *rule-engine* regulasi DJP untuk menyajikan rekomendasi kepatuhan pajak yang proaktif. |

## **🔄 Alur Kerja Eksekusi (Database-First Approach)**

Untuk menghindari kerusakan data (*regression bugs*) pada state management yang sudah berjalan di platform, implementasi wajib dilakukan mengikuti urutan berikut:

┌────────────────────────────────────────┐  
│     Langkah 1: Skema Database (DDL)    │  \<-- Jalankan migrasi pgcrypto & trigger enkripsi  
└──────────────────┬─────────────────────┘  
                   │  
                   ▼  
┌────────────────────────────────────────┐  
│ Langkah 2: Perbarui Type & Zod Schema  │  \<-- Tambahkan registrationYearForUmkm ke model  
└──────────────────┬─────────────────────┘  
                   │  
                   ▼  
┌────────────────────────────────────────┐  
│  Langkah 3: Terapkan Perbaikan Engine  │  \<-- Perbarui calculateConsolidatedTax di taxEngine.ts  
└──────────────────┬─────────────────────┘  
                   │  
                   ▼  
┌────────────────────────────────────────┐  
│  Langkah 4: Integrasi Enkripsi & Mask  │  \<-- Pasang komponen MaskedTaxData di Admin Panel  
└──────────────────┬─────────────────────┘  
                   │  
                   ▼  
┌────────────────────────────────────────┐  
│ Langkah 5: Pasang Smart Advisor UI     │  \<-- Pasang TaxOptimizationAdvisor pada halaman What-If  
└────────────────────────────────────────┘

## **🧪 Validasi & Pengujian Regresi**

Setelah seluruh langkah di atas diselesaikan, pengembang wajib menjalankan suite pengujian lokal untuk memastikan tidak ada perubahan (*breaking changes*) pada test case yang telah didefinisikan sebelumnya:

\# Jalankan unit testing spesifik untuk mesin penghitung pajak  
npm run test tests/taxEngine.test.cjs

\# Jalankan pengujian keamanan endpoint autentikasi  
npm run test tests/apiAuth.test.cjs

Setiap perubahan kode pada taxEngine.ts wajib memulihkan status pengujian hingga **100% Passed** sebelum kode di-merge ke dalam branch main.