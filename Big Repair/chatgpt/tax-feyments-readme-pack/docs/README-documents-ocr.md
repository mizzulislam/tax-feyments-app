# Document Management & OCR Improvement

Dokumen ini menjelaskan perbaikan fitur dokumen dan OCR agar tidak menyesatkan pengguna serta tetap aman untuk data pajak.

---

## Masalah Utama

Fitur OCR dalam aplikasi pajak memiliki risiko tinggi karena dokumen pajak sering berisi data penting seperti:

- nama;
- NPWP/NIK;
- nomor bukti potong;
- masa pajak;
- nilai bruto;
- pajak dipotong;
- kode objek pajak;
- tanggal;
- identitas pemberi kerja/pemotong.

Jika OCR salah membaca data, hasil kalkulasi bisa salah.

---

## Positioning OCR

Jangan posisikan OCR sebagai fitur otomatis penuh.

Gunakan label:

```text
OCR Beta
Ekstraksi dokumen eksperimen
Perlu verifikasi pengguna
```

Hindari klaim:

```text
Otomatis membaca dokumen pajak dengan akurat
Validasi dokumen otomatis
Input pajak otomatis dari bukti potong
```

---

## Recommended OCR Flow

1. Pengguna mengunggah dokumen.
2. Sistem membaca teks.
3. Sistem menampilkan hasil ekstraksi dengan confidence score.
4. Pengguna memverifikasi field.
5. Pengguna menyetujui penyimpanan data.
6. Sistem menyimpan hasil verified.
7. Aktivitas dicatat di audit log.

---

## Required Verification Fields

Untuk dokumen bukti potong, field yang harus diverifikasi:

- jenis dokumen;
- tahun pajak;
- masa pajak;
- nomor bukti potong;
- pemberi kerja/pemotong;
- penghasilan bruto;
- pajak dipotong;
- tanggal dokumen;
- nama penerima penghasilan.

---

## Document Checklist Categories

Kategori dokumen:

### Karyawan

- Bukti potong 1721-A1/A2;
- slip gaji jika diperlukan;
- dokumen pendukung penghasilan lain.

### Freelancer

- bukti potong;
- invoice;
- kontrak kerja;
- rekap pembayaran.

### UMKM

- rekap omzet bulanan;
- bukti pembayaran pajak;
- catatan biaya;
- dokumen usaha.

### Aset

- daftar aset;
- dokumen perolehan;
- dokumen penjualan jika ada.

---

## File Upload Rules

Rekomendasi batasan:

- allowed type: PDF, JPG, PNG;
- max size: 5-10 MB per file;
- private storage bucket;
- signed URL;
- virus/malware scan jika tersedia;
- metadata file disimpan terpisah;
- delete file tersedia untuk pengguna.

---

## Data Model Suggestion

```ts
interface TaxDocument {
  id: string;
  userId: string;
  documentType: string;
  taxYear: number;
  fileName: string;
  storagePath: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  extractedData?: Record<string, unknown>;
  verifiedData?: Record<string, unknown>;
  confidenceScore?: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## UI Warning

Tampilkan pesan:

```text
Hasil OCR dapat keliru. Periksa kembali semua field sebelum menyimpan data ke profil pajak Anda.
```

