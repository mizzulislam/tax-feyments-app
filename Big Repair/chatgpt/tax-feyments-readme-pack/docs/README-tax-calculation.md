# Tax Calculation & Tax Engine Standards

Dokumen ini menjelaskan standar perbaikan tax engine agar hasil perhitungan Tax Feyments lebih transparan, dapat ditelusuri, dan aman digunakan sebagai estimasi.

---

## Masalah yang Harus Dihindari

Tax calculator yang hanya menerima input nominal lalu menampilkan angka pajak berisiko menyesatkan pengguna.

Masalah umum:

- asumsi tidak ditampilkan;
- status PTKP tidak jelas;
- jenis penghasilan tidak jelas;
- tahun pajak tidak jelas;
- regulasi tidak disebutkan;
- hasil terlihat seperti angka final;
- tidak ada catatan validasi;
- tidak ada breakdown.

---

## Prinsip Tax Engine

Tax engine Tax Feyments harus mengikuti prinsip:

1. **Transparent**  
   Semua input, asumsi, dan rumus ditampilkan.

2. **Traceable**  
   Hasil dapat ditelusuri ke input dan rule version.

3. **Defensive**  
   Jika data tidak lengkap, sistem memberi peringatan.

4. **Scenario-based**  
   Perhitungan dibuat berdasarkan skenario pengguna, bukan satu form universal.

5. **Regulation-aware**  
   Tax engine harus menyimpan versi aturan yang digunakan.

---

## Required Output Structure

Setiap hasil perhitungan harus memuat:

```ts
interface TaxCalculationResult {
  calculationId: string;
  taxYear: number;
  taxType: string;
  ruleVersion: string;
  inputSnapshot: Record<string, unknown>;
  assumptions: string[];
  formulaSteps: CalculationStep[];
  estimatedTax: number;
  warnings: string[];
  disclaimer: string;
  createdAt: string;
}

interface CalculationStep {
  label: string;
  formula?: string;
  amount: number;
  explanation: string;
}
```

---

## Calculation Breakdown Example

```text
Jenis Pajak: PPh 21 Karyawan
Tahun Pajak: 2026
Status: Estimasi
Rule Version: PPh21_TER_2024_PMK168

Input:
- Penghasilan bruto bulanan: Rp10.000.000
- Status PTKP: TK/0
- Pegawai tetap: Ya

Asumsi:
- Tidak ada penghasilan tidak teratur.
- Komponen BPJS belum diperhitungkan.
- Hasil perlu dicocokkan dengan bukti potong resmi.

Hasil:
- Estimasi PPh 21: RpXXX
```

---

## Scenario-based Calculator

Kalkulator sebaiknya dibagi menjadi beberapa skenario:

### 1. Karyawan Tetap

Pertanyaan utama:

- Berapa penghasilan bruto?
- Apa status PTKP?
- Apakah ada tunjangan tetap?
- Apakah ada bukti potong?
- Apakah ingin simulasi bulanan atau tahunan?

### 2. Freelancer

Pertanyaan utama:

- Berapa penghasilan per proyek?
- Siapa pemberi kerja/klien?
- Apakah sudah dipotong pajak?
- Apakah ada bukti potong?
- Apakah penghasilan berulang?

### 3. UMKM

Pertanyaan utama:

- Berapa omzet bulanan?
- Apa jenis usaha?
- Apakah menggunakan skema final?
- Apakah ada pencatatan biaya?
- Apakah omzet mendekati threshold tertentu?

### 4. Multi-income

Pertanyaan utama:

- Apa saja sumber penghasilan?
- Mana yang sudah dipotong pajak?
- Mana yang belum memiliki dokumen?
- Apakah ada risiko duplikasi?

---

## Warning Examples

```text
Status PTKP belum diisi. Hasil perhitungan tidak dapat dianggap lengkap.
```

```text
Penghasilan freelance belum memiliki bukti potong. Estimasi akhir tahun dapat berubah.
```

```text
Data penghasilan usaha belum mencakup seluruh bulan dalam tahun pajak.
```

```text
Regulasi yang digunakan perlu diperbarui. Silakan cek kembali rule version.
```

---

## Testing Recommendation

Tax engine perlu diuji untuk:

- input normal;
- input kosong;
- nominal negatif;
- nilai ekstrem;
- status PTKP berbeda;
- beberapa jenis penghasilan;
- pembulatan;
- perubahan rule version;
- hasil dengan dokumen tidak lengkap.

---

## UI Requirement

Setiap halaman hasil kalkulasi harus memiliki tab:

1. Ringkasan;
2. Breakdown;
3. Asumsi;
4. Peringatan;
5. Dasar aturan;
6. Export.

