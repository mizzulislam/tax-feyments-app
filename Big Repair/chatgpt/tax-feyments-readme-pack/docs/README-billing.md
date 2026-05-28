# Billing & Payment Simulation Boundaries

Dokumen ini menjelaskan batasan fitur billing agar Tax Feyments tidak disalahpahami sebagai aplikasi resmi penerbit kode billing pajak.

---

## Masalah Utama

Fitur billing dalam aplikasi pajak sangat sensitif. Jika pengguna melihat istilah seperti “Generate Billing”, mereka dapat mengira aplikasi menerbitkan kode billing resmi.

Tax Feyments tidak boleh memberi kesan sebagai sistem resmi DJP.

---

## Recommended Naming

Gunakan istilah:

- Simulasi Billing;
- Draft Data Pembayaran;
- Panduan Pengisian Billing;
- Payment Preparation Summary;
- Checklist Pembayaran Pajak.

Hindari istilah:

- Generate Kode Billing Resmi;
- Terbitkan Billing;
- Bayar Pajak Resmi;
- Official Tax Payment.

---

## Feature Scope

Fitur billing hanya boleh membantu pengguna menyiapkan data seperti:

- jenis pajak;
- jenis setoran;
- masa pajak;
- tahun pajak;
- nominal estimasi;
- catatan pengisian;
- status dokumen;
- link/instruksi ke sistem resmi.

---

## Mandatory Disclaimer

Tampilkan disclaimer:

```text
Fitur ini hanya membantu menyiapkan draft data pembayaran. Tax Feyments tidak menerbitkan kode billing resmi. Untuk membuat kode billing dan melakukan pembayaran resmi, gunakan sistem DJP/Coretax atau kanal resmi yang berlaku.
```

---

## UI Recommendation

Halaman billing sebaiknya memiliki struktur:

1. Estimasi pajak yang akan dibayar;
2. Draft data pembayaran;
3. Checklist sebelum membuat billing resmi;
4. Panduan masuk ke sistem resmi;
5. Disclaimer;
6. Export draft.

---

## Data Model Suggestion

```ts
interface BillingDraft {
  id: string;
  userId: string;
  taxYear: number;
  taxType: string;
  depositType?: string;
  period?: string;
  estimatedAmount: number;
  sourceCalculationId?: string;
  status: 'draft' | 'reviewed' | 'exported';
  disclaimerAccepted: boolean;
  createdAt: string;
}
```

---

## Risk Warnings

Contoh warning:

```text
Nominal ini berasal dari estimasi. Pastikan nilai final sesuai dokumen dan sistem resmi.
```

```text
Jenis pajak belum dipilih. Draft pembayaran belum dapat dianggap lengkap.
```

```text
Masa pajak belum ditentukan. Periksa kembali sebelum membuat kode billing resmi.
```

