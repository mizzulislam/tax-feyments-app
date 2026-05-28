# 🟠 README-04: Pembersihan Fitur yang Belum Selesai

**Prioritas: TINGGI — Selesaikan atau hapus, jangan biarkan setengah jadi**

---

## Prinsip Dasar

> **"Launch small, launch right."**  
> Fitur yang setengah jadi lebih buruk daripada tidak ada fitur sama sekali. Ia membuang perhatian pengguna dan merusak kepercayaan terhadap fitur yang sudah selesai.

---

## Inventaris Fitur Bermasalah

### 1. 🔴 Streak Counter — Data Hardcoded

**File:** (halaman dashboard utama / profil)

```typescript
// ❌ SAAT INI — Angka palsu yang tidak berubah
const currentStreak = 1;
const longestStreak = 2;
```

Ini menampilkan UI yang seolah-olah fungsional, padahal tidak terhubung ke data apapun.

**Pilihan:**

**A) Hapus (paling cepat)**
```tsx
// Hapus komponen StreakCounter dari JSX
// <StreakCounter current={currentStreak} longest={longestStreak} />
```

**B) Implementasi nyata (jika ingin dipertahankan)**

```sql
-- Tambah di Supabase
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date date;

-- Function untuk update streak
CREATE OR REPLACE FUNCTION update_user_streak(user_id uuid)
RETURNS void AS $$
DECLARE
  last_date date;
  today date := CURRENT_DATE;
BEGIN
  SELECT last_activity_date INTO last_date
  FROM profiles WHERE id = user_id;
  
  IF last_date = today - INTERVAL '1 day' THEN
    -- Streak berlanjut
    UPDATE profiles SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_activity_date = today
    WHERE id = user_id;
  ELSIF last_date < today - INTERVAL '1 day' OR last_date IS NULL THEN
    -- Streak reset
    UPDATE profiles SET 
      current_streak = 1,
      last_activity_date = today
    WHERE id = user_id;
  END IF;
  -- Jika last_date = today, tidak ada yang diubah (sudah login hari ini)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
// src/hooks/useStreak.ts
export function useStreak(userId: string) {
  return useQuery({
    queryKey: ['streak', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, last_activity_date')
        .eq('id', userId)
        .single();
      return data;
    }
  });
}
```

---

### 2. 🔴 Points & XP — Hardcoded Nol

**File:** profile dropdown / halaman profil

```typescript
// ❌ SAAT INI — Selalu 0
<span>0 Points</span>
<span>0 XP</span>
```

**Pilihan:**

**A) Hapus elemen UI ini** sampai sistem gamifikasi benar-benar diimplementasikan.

**B) Tandai sebagai "Coming Soon":**
```tsx
// Ganti tampilan menjadi:
<div className="opacity-50 cursor-default">
  <span className="text-xs text-gray-400">Points & XP</span>
  <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
    Segera Hadir
  </span>
</div>
```

---

### 3. 🟠 OCR Uploader — Error Handling Tidak Memadai

**File:** halaman OCR / document upload

**Masalah:**
- Jika Gemini API gagal, hanya menampilkan pesan error generik
- Tidak ada validasi bahwa hasil OCR sudah benar
- Untuk dokumen pajak yang sensitif, OCR yang salah bisa menyebabkan input data keliru

**Perbaikan Error Handling:**

```typescript
// src/app/api/ocr/route.ts

export async function POST(request: Request) {
  try {
    const result = await callGeminiOCR(file);
    
    return Response.json({
      success: true,
      data: result,
      confidence: result.confidence, // Tambahkan confidence score
      disclaimer: result.confidence < 0.85 
        ? 'Akurasi OCR mungkin rendah. Harap periksa ulang setiap angka sebelum digunakan.'
        : null
    });
    
  } catch (error) {
    // ❌ Jangan hanya return error generik
    // ✅ Berikan panduan apa yang harus dilakukan pengguna

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return Response.json({
        success: false,
        error: 'Layanan OCR sedang sibuk. Coba lagi dalam beberapa menit.',
        fallback: 'Anda bisa input data secara manual di form di bawah ini.'
      }, { status: 429 });
    }
    
    return Response.json({
      success: false,
      error: 'Gagal membaca dokumen. Pastikan gambar jelas dan tidak blur.',
      fallback: 'Coba foto ulang dengan pencahayaan lebih baik, atau input manual.',
      supportedFormats: ['JPG', 'PNG', 'PDF (max 10MB)']
    }, { status: 500 });
  }
}
```

**Tambahkan Validasi Manual Setelah OCR:**
```tsx
// Setelah OCR berhasil, tampilkan form konfirmasi
// agar pengguna bisa koreksi hasil OCR sebelum data disimpan

function OCRResultConfirmation({ ocrData, onConfirm, onEdit }) {
  return (
    <div>
      <div className="bg-yellow-50 border border-yellow-300 p-3 rounded mb-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Periksa hasil OCR di bawah sebelum menyimpan. 
          Angka yang salah bisa mempengaruhi kalkulasi pajak Anda.
        </p>
      </div>
      {/* Form untuk edit/konfirmasi hasil OCR */}
    </div>
  );
}
```

---

### 4. 🟡 Tour Guide (Joyride) — Selector Rapuh

**File:** konfigurasi Joyride

```typescript
// ❌ BERMASALAH — Selector ini bisa tidak ada di semua halaman
const tourSteps = [
  { target: '.tax-type-chip', ... },
  { target: '.upload-area', ... },
]
```

**Perbaikan:**

```typescript
// src/config/tourConfig.ts

// Cek apakah elemen ada sebelum tour dimulai
export function getValidTourSteps(allSteps: Step[]): Step[] {
  return allSteps.filter(step => {
    const element = document.querySelector(step.target as string);
    return element !== null;
  });
}

// Tambahkan fallback jika elemen tidak ditemukan
export function startSafeTour(steps: Step[], startTour: Function) {
  const validSteps = getValidTourSteps(steps);
  
  if (validSteps.length === 0) {
    console.warn('Tour: No valid elements found, skipping tour');
    return;
  }
  
  if (validSteps.length < steps.length) {
    console.warn(`Tour: ${steps.length - validSteps.length} steps skipped (elements not found)`);
  }
  
  startTour({ steps: validSteps });
}
```

---

## Ringkasan Tindakan per Fitur

| Fitur | Rekomendasi | Estimasi Waktu |
|-------|-------------|----------------|
| Streak Counter | Hapus UI atau implementasi DB | 2–4 jam (implementasi) / 30 menit (hapus) |
| Points & XP | Hapus atau ubah ke "Segera Hadir" | 30 menit |
| OCR Uploader | Perbaiki error handling + validasi manual | 3–5 jam |
| Tour Guide | Fix selector + cek elemen sebelum tour | 1–2 jam |

---

## Checklist Perbaikan

- [ ] Streak counter: hapus atau hubungkan ke data DB nyata
- [ ] Points & XP: hapus dari dropdown atau ganti dengan "Segera Hadir"
- [ ] OCR: error handling diperbaiki dengan panduan fallback yang jelas
- [ ] OCR: form konfirmasi manual setelah OCR ditambahkan
- [ ] Tour guide: tidak crash jika target selector tidak ditemukan
- [ ] Review semua halaman lain untuk fitur setengah jadi lainnya
