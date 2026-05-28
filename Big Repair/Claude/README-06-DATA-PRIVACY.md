# 🟠 README-06: Keamanan Data & Privasi

**Prioritas: TINGGI**

---

## Masalah

### 1. Data Sensitif Tersimpan Tanpa Enkripsi Tambahan

NIK, NPWP, data penghasilan, dan aset pengguna tersimpan di Supabase tanpa enkripsi di application layer. Jika terjadi RLS misconfiguration atau data breach, semua data sensitif langsung terbuka.

### 2. Kebiasaan Menyimpan Data di localStorage

```typescript
// src/app/dashboard/assistant/page.tsx
localStorage.setItem('feyn_persona', selectedP);
localStorage.setItem('feyn_custom_personas', JSON.stringify(nextCustomPersonas));
```

Saat ini yang disimpan hanya preferensi persona (relatif tidak sensitif), tapi pola ini bisa secara tidak sengaja merembet ke data yang lebih sensitif di masa mendatang.

---

## Langkah Perbaikan

### Step 1 — Enkripsi Field Sensitif Sebelum Disimpan ke Supabase

Gunakan enkripsi simetris (AES-256) di application layer untuk field NIK dan NPWP. Supabase Vault adalah cara yang lebih proper untuk production, tapi enkripsi di app layer bisa dilakukan sekarang sebagai langkah awal.

**Instalasi:**
```bash
npm install crypto-js
npm install --save-dev @types/crypto-js
```

**Buat utility enkripsi:**
```typescript
// src/lib/encryption.ts

import CryptoJS from 'crypto-js';

// Kunci enkripsi dari environment variable — JANGAN hardcode
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY tidak ditemukan di environment variables');
}

/**
 * Enkripsi data sensitif sebelum disimpan ke database.
 * Gunakan untuk: NIK, NPWP, nomor rekening, data identitas lainnya.
 */
export function encrypt(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY!).toString();
}

/**
 * Dekripsi data untuk ditampilkan ke pengguna.
 */
export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY!);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Mask data sensitif untuk ditampilkan di UI.
 * NIK: 3271****5678 | NPWP: 12.345.***.*-***.**
 */
export function maskNIK(nik: string): string {
  if (nik.length !== 16) return '****************';
  return `${nik.slice(0, 4)}****${nik.slice(-4)}`;
}

export function maskNPWP(npwp: string): string {
  // Format NPWP: XX.XXX.XXX.X-XXX.XXX
  const clean = npwp.replace(/\D/g, '');
  if (clean.length < 9) return npwp;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.***.*-***.***`;
}
```

**Penggunaan saat menyimpan:**
```typescript
// src/app/dashboard/profile/actions.ts
import { encrypt } from '@/lib/encryption';

export async function updateProfile(formData: ProfileFormData) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      // ✅ Enkripsi sebelum simpan
      nik_encrypted: encrypt(formData.nik),
      npwp_encrypted: encrypt(formData.npwp),
      // Data non-sensitif tidak perlu dienkripsi
      full_name: formData.fullName,
      phone: formData.phone,
    })
    .eq('id', userId);
}
```

**Penggunaan saat menampilkan:**
```typescript
// src/app/dashboard/profile/page.tsx
import { decrypt, maskNIK, maskNPWP } from '@/lib/encryption';

// Tampilkan versi tersamarkan di UI (default)
const displayNIK = maskNIK(decrypt(profile.nik_encrypted));

// Tampilkan versi lengkap hanya saat pengguna klik "Tampilkan"
const [showFull, setShowFull] = useState(false);
const displayNIK = showFull 
  ? decrypt(profile.nik_encrypted)
  : maskNIK(decrypt(profile.nik_encrypted));
```

---

### Step 2 — Tambahkan Environment Variable untuk Kunci Enkripsi

**File `.env.local` (lokal — tidak di-commit ke Git):**
```bash
# JANGAN PERNAH commit file ini ke repository
ENCRYPTION_KEY=generate_string_random_32_karakter_atau_lebih_di_sini
```

**Generate kunci yang aman:**
```bash
# Di terminal (Linux/Mac)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Di PowerShell (Windows)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Pastikan `.gitignore` menyertakan:**
```
# .gitignore
.env
.env.local
.env.production
```

---

### Step 3 — Migrasi Kolom Database untuk Enkripsi

```sql
-- Migration: add encrypted columns for sensitive data
-- Jalankan di Supabase SQL Editor

-- Tambah kolom baru untuk data terenkripsi
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nik_encrypted text,
ADD COLUMN IF NOT EXISTS npwp_encrypted text;

-- Setelah data lama dimigrasikan dengan aman, hapus kolom lama:
-- ALTER TABLE public.profiles DROP COLUMN nik;
-- ALTER TABLE public.profiles DROP COLUMN npwp;
-- (Jangan jalankan ini dulu sampai data lama sudah dimigrasikan)
```

---

### Step 4 — Audit dan Bersihkan Penggunaan localStorage

Cari semua penggunaan `localStorage` di proyek:

```bash
# Jalankan di terminal untuk menemukan semua localStorage usage
grep -r "localStorage" src/ --include="*.ts" --include="*.tsx" -l
```

Untuk setiap file yang ditemukan, evaluasi:
- Apakah data yang disimpan sensitif? → Pindahkan ke state management atau DB
- Apakah data hanya preferensi UI? → Boleh tetap di localStorage, tapi dokumentasikan
- Apakah perlu persist antar session? → Pertimbangkan `sessionStorage` atau server-side

**Aturan sederhana untuk localStorage di aplikasi finansial:**
```typescript
// ✅ BOLEH di localStorage
localStorage.setItem('ui_theme', 'dark');
localStorage.setItem('sidebar_collapsed', 'true');
localStorage.setItem('calculator_last_mode', 'simple');

// ❌ JANGAN di localStorage — simpan di DB atau jangan simpan sama sekali
// localStorage.setItem('user_nik', '...');
// localStorage.setItem('user_npwp', '...');
// localStorage.setItem('salary_data', JSON.stringify({...}));
```

---

### Step 5 — Verifikasi RLS Policy Supabase

Pastikan semua tabel dengan data sensitif memiliki RLS yang benar:

```sql
-- Verifikasi RLS aktif di semua tabel sensitif
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Semua tabel dengan data pengguna harus rowsecurity = true

-- Contoh RLS policy yang benar untuk tabel profiles:
-- Pengguna hanya bisa baca/update data miliknya sendiri
CREATE POLICY "Users can only access own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

---

## Checklist Perbaikan

- [ ] Library `crypto-js` diinstall
- [ ] Utility `encryption.ts` dibuat
- [ ] `ENCRYPTION_KEY` ditambahkan ke `.env.local` dan ke Vercel environment variables
- [ ] `.env.local` dipastikan ada di `.gitignore`
- [ ] Kolom `nik_encrypted` dan `npwp_encrypted` ditambahkan ke tabel `profiles`
- [ ] Proses save/load profil menggunakan enkripsi
- [ ] Data NIK/NPWP ditampilkan dalam format masked secara default
- [ ] Audit `localStorage` selesai — tidak ada data sensitif
- [ ] Semua tabel Supabase memiliki RLS aktif
- [ ] Verifikasi manual: simulasikan RLS misconfiguration dan pastikan data tidak bocor

---

## Catatan Penting

Enkripsi di application layer adalah langkah awal yang baik. Untuk produksi yang serius dengan banyak pengguna, pertimbangkan:

- **Supabase Vault** — enkripsi di database layer, lebih aman
- **KMS (Key Management Service)** — AWS KMS atau Google Cloud KMS untuk manajemen kunci yang lebih proper
- **Audit log** — catat setiap akses ke data sensitif

Namun untuk tahap sekarang, enkripsi di app layer + RLS yang benar sudah jauh lebih baik dari kondisi saat ini.
