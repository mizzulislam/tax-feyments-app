# 🔴 README-01: Masalah Kritis — Legalitas & Akurasi Kalkulasi Pajak

**Prioritas: KRITIS — Kerjakan sebelum apapun**

---

## Masalah

### 1. Tarif Sanksi Hardcoded (`taxEngine.ts`)

```typescript
// ❌ BERBAHAYA — Tarif bunga sanksi berubah setiap bulan mengikuti BI Rate
const MAY_2026_SANCTION_INTEREST_RATES = { ... }
```

Tarif bunga sanksi pajak (Pasal 8 KUP) ditetapkan berdasarkan BI Rate + spread dan **diumumkan ulang tiap bulan oleh DJP**. Jika pengguna memakai angka ini bulan depan, hasil kalkulasinya akan salah dan bisa merugikan pengguna secara finansial.

### 2. Tidak Ada Validasi Konteks PPh 21 TER

PPh 21 dengan metode TER (Tarif Efektif Rata-Rata) hanya berlaku untuk **masa Januari–November**. Masa Desember **wajib** menggunakan metode tahunan (gross-up atau non-gross-up). Kalkulator tidak mencegah penggunaan TER di masa Desember.

### 3. Tarif BPHTB Flat 5%

```typescript
// ❌ SALAH — Tarif BPHTB tidak selalu 5%
const BPHTB_RATE = 0.05;
```

Tarif BPHTB ditentukan oleh **Perda masing-masing daerah** dan bisa berkisar 0%–5%. Untuk transaksi properti senilai ratusan juta, selisih tarif bisa mencapai jutaan rupiah.

---

## Langkah Perbaikan

### Step 1 — Tambahkan Disclaimer Wajib di Setiap Output Kalkulasi

Buat komponen `DisclaimerBox` yang **tidak bisa disembunyikan** dan tampil di setiap halaman kalkulasi:

```tsx
// src/components/DisclaimerBox.tsx

export function DisclaimerBox() {
  return (
    <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 my-4 rounded-r-lg">
      <p className="font-bold text-yellow-800 text-sm">⚠️ Perhatian Penting</p>
      <p className="text-yellow-700 text-sm mt-1">
        Hasil kalkulasi ini adalah <strong>estimasi</strong> dan bukan angka pajak resmi. 
        Angka aktual dapat berbeda tergantung kondisi dan kebijakan perpajakan terbaru. 
        Selalu verifikasi dengan konsultan pajak bersertifikat (BKP) atau langsung 
        melalui sistem resmi DJP di{" "}
        <a href="https://pajak.go.id" target="_blank" rel="noopener noreferrer" 
           className="underline font-semibold">
          pajak.go.id
        </a>.
      </p>
    </div>
  );
}
```

Gunakan komponen ini di **setiap** halaman kalkulator:
- `src/app/dashboard/pph21/page.tsx`
- `src/app/dashboard/pph-badan/page.tsx`
- `src/app/dashboard/bphtb/page.tsx`
- `src/app/dashboard/ppn/page.tsx`
- *(dan semua halaman kalkulator lainnya)*

---

### Step 2 — Buat Mekanisme Update Tarif Sanksi

Pindahkan tarif sanksi ke **database/config**, bukan hardcode di kode:

```typescript
// src/lib/taxConfig.ts

// ✅ Ambil dari config yang bisa diupdate, bukan hardcode
export async function getSanctionInterestRate(month: string, year: number): Promise<number> {
  const { data, error } = await supabase
    .from('tax_rates_config')
    .select('rate')
    .eq('type', 'sanction_interest')
    .eq('effective_month', `${year}-${month}`)
    .single();

  if (error || !data) {
    // Fallback ke rate terakhir yang tersedia
    console.warn('Sanction rate not found, using latest available');
    return getLatestSanctionRate();
  }

  return data.rate;
}
```

Buat tabel di Supabase untuk menyimpan tarif yang bisa diupdate:

```sql
-- Migration: create tax_rates_config table
CREATE TABLE IF NOT EXISTS public.tax_rates_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,          -- 'sanction_interest', 'bphtb', dll
  region text,                 -- null = nasional, 'DKI JAKARTA' = spesifik daerah
  effective_month text,        -- format: '2026-05'
  rate numeric(8,6) NOT NULL,
  source_url text,             -- link SK DJP/BI Rate resmi
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

-- RLS: hanya admin yang bisa insert/update
ALTER TABLE public.tax_rates_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only write" ON public.tax_rates_config
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Public read" ON public.tax_rates_config
  FOR SELECT USING (true);
```

---

### Step 3 — Validasi Konteks PPh 21 TER

```typescript
// src/lib/taxEngine.ts

export function validatePPh21TERContext(month: number): ValidationResult {
  if (month === 12) {
    return {
      isValid: false,
      error: 'Metode TER tidak berlaku untuk Masa Desember. ' +
             'Gunakan metode tahunan (Pasal 21 ayat 2 PMK-168/2023).',
      suggestedMethod: 'annual'
    };
  }
  return { isValid: true };
}
```

Panggil fungsi ini sebelum kalkulasi dijalankan dan tampilkan pesan error yang jelas ke pengguna.

---

### Step 4 — Perbaikan Kalkulasi BPHTB

```typescript
// src/lib/taxEngine.ts

// ✅ Tarif BPHTB berdasarkan daerah
const BPHTB_RATES_BY_REGION: Record<string, number> = {
  'DKI JAKARTA': 0.05,
  'SURABAYA': 0.05,
  'BANDUNG': 0.05,
  // ... tambah daerah lain
  'DEFAULT': 0.05, // fallback dengan disclaimer
};

export function calculateBPHTB(
  njop: number, 
  njoptkp: number, 
  region: string
): BPHTBResult {
  const rate = BPHTB_RATES_BY_REGION[region.toUpperCase()] 
               ?? BPHTB_RATES_BY_REGION['DEFAULT'];
  
  const isDefaultRate = !BPHTB_RATES_BY_REGION[region.toUpperCase()];
  
  const taxBase = Math.max(0, njop - njoptkp);
  const taxAmount = taxBase * rate;

  return {
    taxAmount,
    rate,
    disclaimer: isDefaultRate 
      ? `Tarif 5% digunakan sebagai estimasi. Tarif BPHTB untuk ${region} ` +
        `dapat berbeda berdasarkan Perda setempat. Verifikasi ke BPRD/BPKD daerah Anda.`
      : null
  };
}
```

---

## Checklist Perbaikan

- [ ] Komponen `DisclaimerBox` dibuat dan dipasang di semua halaman kalkulator
- [ ] Tabel `tax_rates_config` dibuat di Supabase
- [ ] Tarif sanksi dipindahkan dari hardcode ke database
- [ ] Validasi konteks PPh 21 TER untuk Masa Desember ditambahkan
- [ ] Kalkulasi BPHTB menggunakan tarif per daerah (dengan disclaimer jika daerah tidak dikenali)
- [ ] Test kalkulasi diverifikasi oleh minimal 1 orang yang memahami perpajakan Indonesia

---

## Referensi

- PMK-168/PMK.03/2023 tentang PPh Pasal 21/26
- UU BPHTB No. 21 Tahun 1997 jo. UU No. 20 Tahun 2000
- Pengumuman tarif bunga sanksi DJP: https://www.pajak.go.id/id/peraturan/tarif-bunga
