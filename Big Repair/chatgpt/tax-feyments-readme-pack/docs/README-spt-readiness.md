# SPT Readiness Dashboard

Dokumen ini merancang fitur **SPT Readiness Score** sebagai fitur pembeda utama Tax Feyments.

---

## Tujuan

Dashboard Tax Feyments sebaiknya tidak hanya menampilkan grafik dan angka, tetapi menjawab pertanyaan utama pengguna:

> Apakah saya sudah siap untuk melaporkan pajak?

SPT Readiness Score membantu pengguna memahami tingkat kelengkapan data sebelum masuk ke sistem resmi DJP/Coretax.

---

## Komponen Readiness Score

Skor kesiapan dihitung dari beberapa kategori.

| Kategori | Bobot Rekomendasi |
|---|---:|
| Profil pajak lengkap | 20% |
| Sumber penghasilan tercatat | 25% |
| Dokumen pendukung tersedia | 25% |
| Kalkulasi sudah dibuat | 15% |
| Risiko data telah ditinjau | 10% |
| Ringkasan/export tersedia | 5% |

Total: 100%.

---

## Status Readiness

| Score | Status | Meaning |
|---:|---|---|
| 0-39 | Belum siap | Banyak data penting belum lengkap |
| 40-69 | Perlu dilengkapi | Data dasar tersedia, tetapi belum cukup aman |
| 70-89 | Hampir siap | Mayoritas data tersedia, perlu review akhir |
| 90-100 | Siap review | Data cukup lengkap untuk dicek sebelum pelaporan resmi |

---

## Checklist Data

### Profil Pajak

- nama pengguna;
- status PTKP;
- tahun pajak;
- jenis pekerjaan;
- kategori Wajib Pajak;
- preferensi pajak.

### Penghasilan

- penghasilan karyawan;
- penghasilan freelance;
- penghasilan usaha;
- penghasilan lain;
- periode penghasilan;
- status sudah/belum dipotong pajak.

### Dokumen

- bukti potong;
- rekap penghasilan;
- rekap omzet;
- daftar aset;
- bukti pembayaran;
- dokumen biaya.

### Kalkulasi

- tax engine sudah dijalankan;
- rule version tersedia;
- input snapshot tersimpan;
- breakdown tersedia;
- disclaimer ditampilkan.

---

## Risk Warnings

Dashboard harus menampilkan peringatan jika ada kondisi seperti:

```text
Anda mencatat penghasilan freelance, tetapi belum menandai apakah penghasilan tersebut sudah dipotong pajak oleh pemberi kerja.
```

```text
Anda memiliki penghasilan usaha, tetapi belum mengisi rekap omzet bulanan.
```

```text
Status PTKP belum diisi. Estimasi PPh dapat berubah secara signifikan.
```

```text
Bukti potong belum diunggah. Cocokkan kembali hasil estimasi dengan dokumen resmi dari pemberi kerja.
```

---

## Dashboard Layout Recommendation

Urutan konten dashboard:

1. **SPT Readiness Score**
2. **Next Best Action**
3. **Missing Documents**
4. **Tax Estimate Summary**
5. **Risk Warnings**
6. **Upcoming Deadlines**
7. **Recent Activity**
8. **Charts and Trends**

Grafik tidak boleh menjadi elemen utama jika data belum lengkap.

---

## Next Best Action Examples

- Lengkapi status PTKP.
- Tambahkan bukti potong 1721-A1.
- Verifikasi penghasilan freelance.
- Isi omzet bulan Januari sampai Desember.
- Review hasil estimasi pajak.
- Export ringkasan persiapan SPT.

---

## Data Model Suggestion

```ts
interface SPTReadinessItem {
  id: string;
  category: 'profile' | 'income' | 'document' | 'calculation' | 'risk' | 'export';
  label: string;
  status: 'complete' | 'incomplete' | 'needs_review';
  weight: number;
  actionLabel?: string;
  actionHref?: string;
}
```

