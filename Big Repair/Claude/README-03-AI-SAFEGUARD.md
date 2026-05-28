# 🔴 README-03: Masalah Kritis — Safeguard AI Assistant (Feyn)

**Prioritas: KRITIS**

---

## Masalah

### 1. Filter `RISK_WORDS` Terlalu Lemah

```typescript
// src/app/api/chat/route.ts
// ❌ Hanya memblokir kata ekstrem, tidak menangani grey area
const RISK_WORDS = ['sengketa', 'banding', 'penggelapan', 'pidana', ...]
```

Filter ini hanya menangkap kasus paling ekstrem. AI tetap bisa memberikan:
- Interpretasi pasal yang salah tapi terdengar meyakinkan
- Saran tax planning yang legal di permukaan tapi tidak tepat konteks
- Angka PTKP/tarif yang outdated jika model tidak up-to-date

### 2. Persona "Humor/Gaul/Kocak" untuk Topik Serius

Pengguna bisa memilih persona AI yang lucu/informal untuk bertanya soal pajak. Respons yang humoris tapi **salah secara hukum** tetap bisa dipercaya pengguna karena konteksnya aplikasi pajak.

### 3. Tidak Ada Watermark Disclaimer pada Setiap Respons AI

Respons AI tampil seperti jawaban otoritatif tanpa tanda bahwa ini bukan konsultasi profesional.

---

## Langkah Perbaikan

### Step 1 — Tambahkan System Prompt yang Kuat dan Wajib

Update system prompt di `src/app/api/chat/route.ts` dengan instruksi yang tidak bisa di-override oleh persona apapun:

```typescript
// src/app/api/chat/route.ts

const MANDATORY_SAFETY_SYSTEM_PROMPT = `
Kamu adalah asisten pajak INFORMATIF, bukan konsultan pajak resmi.

ATURAN YANG TIDAK BOLEH DILANGGAR (berlaku untuk semua persona):
1. SELALU akhiri setiap respons tentang pajak dengan disclaimer:
   "⚠️ Ini adalah informasi umum, bukan konsultasi pajak profesional. Untuk keputusan finansial, konsultasikan dengan konsultan pajak bersertifikat (BKP) atau hubungi KPP terdekat."

2. Jika pengguna menanyakan angka pasti (tarif, denda, sanksi):
   - Sebutkan angka estimasi berdasarkan pengetahuanmu
   - WAJIB tambahkan: "Verifikasi angka terbaru di pajak.go.id karena tarif bisa berubah"

3. Jika pertanyaan menyangkut: sengketa pajak, keberatan, banding, pemeriksaan,
   penyidikan, ATAU situasi yang bisa berujung sanksi pidana:
   WAJIB sarankan: "Ini memerlukan pendampingan konsultan pajak atau kuasa hukum pajak. 
   Saya tidak bisa memberikan saran hukum yang mengikat."

4. Jika pertanyaan tentang: cara mengurangi pajak, tax planning, skema bisnis:
   Jelaskan konsep umum yang LEGAL saja. Tambahkan: 
   "Implementasi tax planning yang tepat memerlukan analisis situasi spesifik oleh profesional."

5. SELALU jujur jika tidak yakin dengan suatu ketentuan. Gunakan frasa:
   "Berdasarkan pengetahuan saya, namun perlu dikonfirmasi ke DJP..."

TENTANG PERSONA:
- Kamu boleh berkomunikasi dengan gaya yang dipilih pengguna (formal, santai, dll)
- TAPI: akurasi informasi dan disclaimer TIDAK BOLEH dikurangi karena gaya komunikasi
- Gaya humoris TIDAK BERARTI boleh memberikan informasi yang tidak akurat
`;

// Gabungkan dengan persona yang dipilih pengguna
function buildSystemPrompt(userPersona: string): string {
  return `${MANDATORY_SAFETY_SYSTEM_PROMPT}\n\nGAYA KOMUNIKASI:\n${userPersona}`;
}
```

---

### Step 2 — Tambahkan Watermark Visual pada Setiap Respons AI

```tsx
// src/components/AIResponseWrapper.tsx

interface AIResponseWrapperProps {
  children: React.ReactNode;
  showDisclaimer?: boolean;
}

export function AIResponseWrapper({ 
  children, 
  showDisclaimer = true 
}: AIResponseWrapperProps) {
  return (
    <div className="ai-response">
      {children}
      
      {showDisclaimer && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-400 flex items-start gap-1">
            <span>⚠️</span>
            <span>
              Respons AI — bukan konsultasi pajak profesional. Verifikasi ke{" "}
              <a 
                href="https://pajak.go.id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
              >
                pajak.go.id
              </a>{" "}
              atau konsultan pajak bersertifikat untuk keputusan finansial.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
```

---

### Step 3 — Nonaktifkan Persona yang Melemahkan Kredibilitas untuk Topik Pajak

Pertahankan opsi persona yang membantu komunikasi (formal, santai, bilingual), tapi hapus atau nonaktifkan persona yang secara eksplisit mengutamakan humor di atas akurasi:

```typescript
// src/config/personas.ts

export const ALLOWED_PERSONAS = [
  { id: 'formal', label: 'Formal & Profesional', description: 'Bahasa resmi, tepat sasaran' },
  { id: 'friendly', label: 'Ramah & Jelas', description: 'Santai tapi tetap akurat' },
  { id: 'bilingual', label: 'Bilingual (ID/EN)', description: 'Campuran Indonesia-Inggris' },
  { id: 'simple', label: 'Bahasa Sederhana', description: 'Hindari jargon teknis' },
];

// Persona berikut DINONAKTIFKAN untuk konten pajak:
export const DISABLED_PERSONAS_FOR_TAX = [
  'humor',    // ❌ Humor bisa mengurangi persepsi akurasi
  'kocak',    // ❌ 
  'gaul',     // ❌ Bisa menyebabkan informasi hukum disampaikan tidak serius
  // Jika ingin dipertahankan, pastikan system prompt menjamin akurasi tetap terjaga
];
```

---

### Step 4 — Perkuat Filter Konten dengan Kategori Bertingkat

```typescript
// src/lib/contentFilter.ts

export enum RiskLevel {
  LOW = 'low',        // Informasi umum, boleh dijawab
  MEDIUM = 'medium',  // Perlu disclaimer tambahan
  HIGH = 'high',      // Harus sarankan konsultan
  BLOCK = 'block'     // Tolak dan arahkan ke profesional
}

export function assessRiskLevel(message: string): RiskLevel {
  const lowerMsg = message.toLowerCase();
  
  // Level BLOCK — tolak, arahkan ke profesional
  const blockPatterns = [
    /pidana/, /penggelapan/, /penyelundupan/, /korupsi/,
    /manipulasi.*pajak/, /fiktif/, /tidak.*lapor.*sengaja/
  ];
  if (blockPatterns.some(p => p.test(lowerMsg))) return RiskLevel.BLOCK;
  
  // Level HIGH — jawab tapi wajib sarankan profesional
  const highPatterns = [
    /sengketa/, /keberatan/, /banding/, /pemeriksaan/, /penyidikan/,
    /restitusi.*besar/, /kurang bayar.*besar/, /denda.*besar/
  ];
  if (highPatterns.some(p => p.test(lowerMsg))) return RiskLevel.HIGH;
  
  // Level MEDIUM — jawab dengan disclaimer tarif/angka
  const mediumPatterns = [
    /berapa.*tarif/, /berapa.*pajak/, /berapa.*denda/,
    /tax planning/, /hemat pajak/, /minimalisir pajak/,
    /skema.*pajak/, /struktur.*bisnis/
  ];
  if (mediumPatterns.some(p => p.test(lowerMsg))) return RiskLevel.MEDIUM;
  
  return RiskLevel.LOW;
}

export function getRiskResponse(level: RiskLevel): string | null {
  switch (level) {
    case RiskLevel.BLOCK:
      return 'Saya tidak bisa membantu dengan permintaan ini. ' +
             'Jika Anda menghadapi masalah pajak serius, silakan hubungi konsultan pajak ' +
             'bersertifikat atau KPP setempat.';
    case RiskLevel.HIGH:
      return null; // Jawab, tapi tambahkan disclaimer di system prompt
    default:
      return null;
  }
}
```

---

## Checklist Perbaikan

- [ ] `MANDATORY_SAFETY_SYSTEM_PROMPT` ditambahkan dan selalu disertakan di setiap API call
- [ ] Komponen `AIResponseWrapper` dengan disclaimer ditampilkan di setiap respons AI
- [ ] Persona yang melemahkan akurasi dinonaktifkan atau dibatasi
- [ ] Filter konten bertingkat (`RiskLevel`) diimplementasikan
- [ ] Diuji: tanya soal sengketa pajak → harus mendapat saran untuk ke konsultan
- [ ] Diuji: tanya soal tarif → harus ada disclaimer "verifikasi ke pajak.go.id"
- [ ] Diuji: persona humor → disclaimer tetap muncul dan akurasi tidak berkurang

---

## Referensi

- PP 74 Tahun 2011 tentang Tata Cara Pelaksanaan Hak dan Pemenuhan Kewajiban Perpajakan
- Konsultan pajak bersertifikat: https://www.ikpi.or.id (Ikatan Konsultan Pajak Indonesia)
- KPP terdekat: https://www.pajak.go.id/id/unit-kerja
