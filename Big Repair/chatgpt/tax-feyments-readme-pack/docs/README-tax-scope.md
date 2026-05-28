# Tax Scope & Regulatory Boundaries

Dokumen ini menjelaskan cakupan pajak yang didukung Tax Feyments serta batasan regulasi yang perlu ditampilkan secara jelas kepada pengguna.

---

## Tujuan Dokumen

Aplikasi pajak tidak boleh hanya menampilkan angka. Aplikasi harus menjelaskan:

- jenis pajak apa yang dihitung;
- tahun pajak yang digunakan;
- regulasi yang menjadi dasar;
- asumsi yang digunakan;
- kondisi yang belum didukung;
- apakah hasil bersifat estimasi atau final.

---

## Cakupan Pajak yang Disarankan untuk MVP

Untuk MVP, Tax Feyments sebaiknya fokus pada Wajib Pajak Orang Pribadi dan UMKM kecil.

### 1. PPh 21 Karyawan

Digunakan untuk simulasi penghasilan dari pekerjaan sebagai pegawai.

Data minimal:

- penghasilan bruto;
- status PTKP;
- periode penghasilan;
- status pegawai tetap/tidak tetap;
- komponen potongan;
- bukti potong jika tersedia.

Output:

- estimasi PPh 21;
- breakdown asumsi;
- catatan bahwa angka final perlu dicocokkan dengan bukti potong pemberi kerja.

### 2. Penghasilan Freelance/Jasa

Digunakan untuk pengguna dengan penghasilan proyek, jasa, atau pekerjaan tidak tetap.

Data minimal:

- daftar pemberi kerja/klien;
- nilai bruto per transaksi;
- apakah sudah dipotong pajak;
- dokumen bukti potong jika ada;
- kategori jasa/pekerjaan.

Output:

- klasifikasi awal;
- potensi pajak terkait;
- peringatan jika klasifikasi belum pasti.

### 3. UMKM

Digunakan untuk pengguna dengan usaha kecil.

Data minimal:

- omzet bulanan;
- tahun pajak;
- jenis usaha;
- status penggunaan skema final/non-final;
- catatan threshold jika relevan.

Output:

- estimasi pajak;
- rekap omzet;
- catatan dokumen yang perlu disiapkan.

### 4. Penghasilan Campuran

Digunakan untuk pengguna yang memiliki lebih dari satu sumber penghasilan.

Contoh:

- karyawan + freelance;
- karyawan + UMKM;
- freelance + usaha kecil.

Output:

- ringkasan semua sumber penghasilan;
- potensi pajak per kategori;
- risiko duplikasi atau salah klasifikasi.

---

## Batasan yang Harus Ditampilkan

Tax Feyments sebaiknya menampilkan batasan berikut di UI dan dokumentasi:

```text
Hasil perhitungan bersifat estimasi dan tidak menggantikan perhitungan resmi, bukti potong, konsultan pajak, atau sistem DJP/Coretax.
```

```text
Beberapa skenario pajak kompleks belum didukung, seperti pajak perusahaan, transaksi lintas negara, transfer pricing, PPN kompleks, pajak warisan, dan sengketa pajak.
```

---

## Tax Rule Versioning

Tax engine harus menyimpan versi aturan yang digunakan dalam setiap perhitungan.

Contoh format:

```text
PPh21_TER_2024_PMK168
PPhOP_PROGRESSIVE_UU_HPP
UMKM_FINAL_PP23
SPT_OP_PREPARATION_2026
```

Setiap calculation result sebaiknya menyimpan:

- `tax_year`;
- `calculation_date`;
- `rule_version`;
- `input_snapshot`;
- `formula_snapshot`;
- `assumption_snapshot`.

---

## Supported vs Unsupported Scope

| Area | MVP Status | Notes |
|---|---:|---|
| PPh 21 karyawan | Supported | Simulasi dan edukasi, bukan angka final |
| Freelance income | Partial | Perlu klasifikasi manual dan disclaimer |
| UMKM sederhana | Supported | Fokus rekap omzet dan estimasi |
| SPT readiness | Supported | Checklist dan data completeness |
| Coretax integration | Not supported | Hanya persiapan data |
| Official billing code | Not supported | Hanya simulasi/draft |
| Corporate tax | Not supported | Di luar MVP |
| International tax | Not supported | Di luar MVP |
| Tax dispute | Not supported | Harus diarahkan ke profesional |

---

## UI Requirement

Setiap halaman kalkulasi harus memiliki panel:

1. **Dasar Perhitungan**
2. **Asumsi**
3. **Data yang Digunakan**
4. **Batasan**
5. **Langkah Berikutnya**

