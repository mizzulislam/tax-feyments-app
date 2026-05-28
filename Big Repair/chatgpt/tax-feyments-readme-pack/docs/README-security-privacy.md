# Security & Privacy Improvement

Dokumen ini menjelaskan standar keamanan dan privasi yang perlu diterapkan karena Tax Feyments memproses data pajak, penghasilan, aset, dan dokumen sensitif.

---

## Mengapa Ini Penting

Data pajak adalah data sensitif. Pengguna dapat memasukkan:

- penghasilan;
- aset;
- dokumen bukti potong;
- rekap omzet;
- informasi pekerjaan;
- data identitas;
- catatan transaksi.

Karena itu, aplikasi harus dibangun dengan prinsip **privacy by design** dan **least privilege**.

---

## Minimum Security Requirements

### 1. Authentication

- email/password atau OAuth;
- session management aman;
- proteksi route dashboard;
- redirect user tidak terautentikasi;
- validasi server-side untuk API sensitif.

### 2. Row Level Security

Supabase RLS wajib aktif untuk semua tabel user-owned data.

Prinsip:

```text
User hanya boleh membaca dan mengubah data miliknya sendiri.
```

### 3. API Authorization

Setiap API endpoint harus memverifikasi:

- user session;
- resource ownership;
- role permission;
- request payload validation.

### 4. Input Validation

Gunakan schema validation untuk:

- nominal uang;
- tahun pajak;
- tanggal;
- file upload;
- role;
- status dokumen;
- kategori penghasilan.

### 5. Security Headers

Gunakan security headers seperti:

- Content Security Policy;
- X-Frame-Options;
- X-Content-Type-Options;
- Referrer-Policy;
- Permissions-Policy.

---

## Privacy Features

Tambahkan fitur pengguna:

- download my data;
- delete my account;
- delete uploaded documents;
- mask NPWP/NIK;
- manage AI consent;
- clear AI chat history;
- view document access history.

---

## Data Masking

Data sensitif sebaiknya ditampilkan dalam format masked.

Contoh:

```text
NPWP: 12.345.***.*-***.***
NIK: 3174********0001
```

Tombol “show full data” hanya muncul setelah konfirmasi pengguna.

---

## Document Security

Untuk dokumen:

- batasi jenis file;
- batasi ukuran file;
- scan metadata jika memungkinkan;
- simpan path file dengan owner ID;
- jangan gunakan public bucket untuk dokumen sensitif;
- gunakan signed URL sementara;
- catat akses dokumen.

---

## AI Privacy

Sebelum data dikirim ke AI provider, aplikasi harus:

- meminta consent;
- menjelaskan data apa yang digunakan;
- memberi opsi opt-out;
- menghindari pengiriman file mentah jika tidak diperlukan;
- menghapus data yang tidak relevan dari prompt.

---

## Admin Access Policy

Admin tidak boleh bebas melihat data pajak pengguna.

Admin support hanya boleh melihat:

- data teknis akun;
- status error;
- data yang sudah dimasking;
- informasi yang diberi izin oleh pengguna.

Akses penuh hanya boleh melalui mekanisme khusus dan tercatat di audit log.

---

## Audit Log

Simpan aktivitas sensitif:

- login;
- upload dokumen;
- delete dokumen;
- export PDF;
- penggunaan AI dengan data pribadi;
- admin melihat data;
- perubahan role;
- perubahan profil pajak.

Contoh model:

```ts
interface AuditLog {
  id: string;
  userId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

---

## Privacy Policy Page

Aplikasi harus memiliki halaman Privacy Policy yang menjelaskan:

- data apa yang dikumpulkan;
- tujuan penggunaan data;
- penggunaan AI;
- penyimpanan dokumen;
- hak pengguna untuk menghapus data;
- batasan tanggung jawab aplikasi.

