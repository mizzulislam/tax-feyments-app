# 🟡 README-07: Perbaikan Teknis — SQL Migration, Bundle Size, Rate Limiting

**Prioritas: MENENGAH**

---

## Masalah 1 — SQL Migration Ditampilkan ke End User

Hampir setiap halaman memiliki blok `MIGRATION_SQL` yang di-render ke pengguna:

```typescript
// ❌ ANTIPATTERN — ini ada di hampir setiap halaman
const MIGRATION_SQL = `
  CREATE TABLE IF NOT EXISTS public.what_if_scenarios (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ...
  )
`;

// Lalu di-render ke UI sebagai blok teks
<pre>{MIGRATION_SQL}</pre>
```

**Kenapa ini masalah:**
- Pengguna tidak perlu tahu struktur database
- Membingungkan non-developer
- Mengekspose informasi arsitektur yang seharusnya internal
- Jika ada security issue di SQL, bisa dieksploitasi

---

### Perbaikan: Pisahkan Migration ke File Terpisah

**Struktur folder yang benar:**

```
my-tax-app/
├── supabase/
│   ├── migrations/
│   │   ├── 20240101000000_initial_schema.sql
│   │   ├── 20240201000000_add_what_if_scenarios.sql
│   │   ├── 20240301000000_add_tax_rates_config.sql
│   │   └── 20240401000000_add_encrypted_columns.sql
│   └── seed.sql           ← data awal untuk development
├── src/
│   └── ...
└── README.md
```

**Langkah-langkah:**

1. Buat folder `supabase/migrations/` di root project
2. Pindahkan semua `MIGRATION_SQL` dari halaman-halaman ke file `.sql` terpisah
3. Hapus semua referensi SQL dari komponen React/Next.js
4. Dokumentasikan cara menjalankan migration di `README.md`:

```markdown
## Database Setup (untuk Developer)

### Cara menjalankan migration baru:

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login ke Supabase:
   ```bash
   supabase login
   ```

3. Jalankan migration:
   ```bash
   supabase db push
   ```

Atau jalankan file SQL secara manual di Supabase Dashboard → SQL Editor.

### Daftar Migration

| File | Deskripsi |
|------|-----------|
| `20240101000000_initial_schema.sql` | Schema awal: profiles, tax_records |
| `20240201000000_add_what_if_scenarios.sql` | Tabel simulasi what-if |
| ... | ... |
```

5. Hapus blok `MIGRATION_SQL` dan UI terkait dari semua halaman:

```bash
# Cari semua file yang mengandung MIGRATION_SQL
grep -r "MIGRATION_SQL" src/ --include="*.ts" --include="*.tsx" -l
```

---

## Masalah 2 — Bundle Size yang Kemungkinan Besar

Aplikasi menggunakan banyak library besar: Recharts, jsPDF, QRCode, react-joyride, react-markdown, remark-gfm, dll. Tanpa code splitting, semua ini dimuat di halaman pertama — lambat untuk pengguna mobile Indonesia.

---

### Perbaikan: Implementasi Dynamic Import untuk Library Berat

```typescript
// ❌ SEBELUM — semua dimuat saat halaman load
import { BarChart, LineChart } from 'recharts';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import Joyride from 'react-joyride';

// ✅ SESUDAH — hanya dimuat saat dibutuhkan
import dynamic from 'next/dynamic';

// Chart hanya dimuat di halaman yang menampilkan chart
const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded" /> }
);

// PDF generator hanya dimuat saat pengguna klik "Export PDF"
async function handleExportPDF() {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // ... generate PDF
}

// QR Code hanya dimuat di halaman billing (yang akan diubah/hapus)
const QRCodeDisplay = dynamic(() => import('@/components/QRCodeDisplay'), {
  loading: () => <div className="w-32 h-32 bg-gray-100 animate-pulse" />
});

// Tour guide dimuat hanya jika user baru pertama kali
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });
```

---

### Analisis Bundle Size

Jalankan ini untuk melihat apa yang memakan space:

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Tambahkan ke next.config.js:
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({
  // config lainnya
});

# Jalankan analisis
ANALYZE=true npm run build
```

Ini akan membuka visualisasi di browser yang menunjukkan ukuran setiap modul.

---

## Masalah 3 — Rate Limiting Tidak Optimal

```typescript
// ❌ Angka tidak ada justifikasinya
const RATE_LIMIT_MAX = 20; // per 60 detik
```

---

### Perbaikan: Rate Limiting Bertingkat Berdasarkan Jenis Request

```typescript
// src/lib/rateLimit.ts

export const RATE_LIMITS = {
  // Chat AI — lebih ketat karena mahal
  chat: {
    max: 10,        // 10 pesan per menit
    window: 60,     // dalam 60 detik
    message: 'Terlalu banyak pertanyaan. Tunggu sebentar sebelum tanya lagi.'
  },
  
  // Kalkulasi — cukup longgar karena tidak ada API cost
  calculation: {
    max: 60,
    window: 60,
    message: 'Terlalu banyak kalkulasi. Coba lagi dalam semenit.'
  },
  
  // OCR — ketat karena mahal (Gemini API)
  ocr: {
    max: 5,
    window: 300,    // 5 upload per 5 menit
    message: 'Batas upload dokumen tercapai. Tunggu 5 menit sebelum upload lagi.'
  },
  
  // Export PDF — sedang
  export: {
    max: 10,
    window: 300,
    message: 'Terlalu banyak export. Tunggu 5 menit.'
  }
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;
```

Gunakan di setiap API route:
```typescript
// src/app/api/chat/route.ts
import { RATE_LIMITS } from '@/lib/rateLimit';
import { checkRateLimit } from '@/lib/rateLimitMiddleware';

export async function POST(request: Request) {
  const rateLimitResult = await checkRateLimit(request, 'chat');
  
  if (!rateLimitResult.allowed) {
    return Response.json(
      { error: RATE_LIMITS.chat.message },
      { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining)
        }
      }
    );
  }
  
  // ... lanjutkan ke proses chat
}
```

---

## Checklist Perbaikan

**SQL Migration:**
- [ ] Folder `supabase/migrations/` dibuat
- [ ] Semua SQL dari halaman-halaman dipindahkan ke file migration
- [ ] `grep -r "MIGRATION_SQL"` tidak menemukan hasil apapun di `src/`
- [ ] `README.md` di-update dengan instruksi cara menjalankan migration

**Bundle Size:**
- [ ] `@next/bundle-analyzer` diinstall
- [ ] `ANALYZE=true npm run build` dijalankan dan hasilnya direview
- [ ] Dynamic import diterapkan untuk: Recharts, jsPDF, QRCode, react-joyride
- [ ] First load JS bundle < 200KB (target ideal untuk mobile Indonesia)

**Rate Limiting:**
- [ ] `RATE_LIMITS` config dibuat dengan nilai yang terjustifikasi
- [ ] Chat AI: 10 req/menit
- [ ] OCR: 5 req/5 menit
- [ ] Header `Retry-After` disertakan di response 429
- [ ] UI menampilkan pesan informatif saat rate limit tercapai (bukan hanya error)
