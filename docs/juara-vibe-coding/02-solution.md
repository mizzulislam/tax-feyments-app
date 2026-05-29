# 02 — Solution Optimization

## Rubric

Solution bernilai 40%. Ini bobot terbesar. Aplikasi harus fungsional, profesional, mudah digunakan, dan menghasilkan value nyata.

## Flow Utama

```text
Start Tax Checkup
→ Pilih Persona
→ Input Penghasilan
→ Upload Dokumen
→ Verifikasi Dokumen
→ Readiness Score
→ AI Next Best Action
→ Export PDF
```

## Fitur Pusat: SPT Readiness Score

Dashboard harus menjadikan readiness score sebagai komponen utama.

Contoh:

```text
SPT Readiness: 72%
Tax Health: Perlu Perhatian

Belum lengkap:
- Bukti potong 1721-A1
- Daftar aset
- Rekap invoice freelance
```

## Formula Awal Readiness Score

Gunakan scoring sederhana terlebih dahulu:

| Komponen | Bobot |
|---|---:|
| Profil wajib pajak lengkap | 15% |
| Status PTKP terisi | 10% |
| Sumber penghasilan tercatat | 20% |
| Dokumen pendukung tersedia | 25% |
| Data aset tersedia | 10% |
| Estimasi pajak sudah dihitung | 10% |
| Deadline/checklist aktif | 10% |

## Next Best Action

Sistem harus menghasilkan rekomendasi prioritas.

Contoh:

```text
1. Upload bukti potong dari pemberi kerja.
2. Lengkapi daftar aset.
3. Konfirmasi apakah penghasilan freelance sudah dipotong pajak.
4. Export Tax Readiness Report setelah data minimal 80% lengkap.
```

## Tax Readiness Report PDF

PDF wajib menjadi output akhir.

Isi PDF:

- profil user;
- persona pajak;
- readiness score;
- tax health badge;
- ringkasan penghasilan;
- estimasi pajak;
- dokumen lengkap/belum lengkap;
- next best action;
- AI insight;
- disclaimer.

## Acceptance Criteria

- [ ] User punya alur jelas dari awal sampai export.
- [ ] Dashboard tidak kosong meskipun user baru memakai demo data.
- [ ] Ada readiness score.
- [ ] Ada next best action.
- [ ] Ada PDF report.
- [ ] Ada disclaimer dalam hasil kalkulasi dan report.
