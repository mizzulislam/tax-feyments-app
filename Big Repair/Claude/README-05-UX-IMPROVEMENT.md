# 🟠 README-05: Perbaikan UX & Navigasi

**Prioritas: TINGGI**

---

## Masalah

### 1. Terminologi Formulir Terlalu Teknis untuk Pengguna Awam

Halaman kalkulator PPh 21 Tahunan menggunakan istilah dari formulir 1721-A1 DJP yang hanya dipahami tim payroll/HR:

- "Penerimaan dalam bentuk natura dan kenikmatan lainnya"
- "Tantiem, bonus, gratifikasi, jasa produksi dan THR"
- "Honorarium dan imbalan lain sejenisnya"

Karyawan biasa tidak tahu cara mengisi ini — mereka akhirnya menebak atau meninggalkan aplikasi.

### 2. Navigasi Sidebar Terlalu Dalam

Sidebar punya terlalu banyak level:
```
Dashboard
└── Manajemen Pajak
    ├── Sub-menu 1
    ├── Sub-menu 2
    ├── Sub-menu 3
    ├── Sub-menu 4
    ├── Sub-menu 5
    └── Sub-menu 6
Belajar & AI
├── Sub-menu 1
└── Sub-menu 2
```

Untuk sampai ke fitur utama, pengguna perlu terlalu banyak klik.

---

## Langkah Perbaikan

### Step 1 — Implementasi Dua Mode Kalkulator: Awam vs Profesional

```tsx
// src/app/dashboard/pph21/page.tsx

type CalculatorMode = 'simple' | 'professional';

export default function PPh21Calculator() {
  const [mode, setMode] = useState<CalculatorMode>('simple');

  return (
    <div>
      {/* Mode Switcher */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setMode('simple')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'simple' 
              ? 'bg-white shadow text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👤 Mode Karyawan
        </button>
        <button
          onClick={() => setMode('professional')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'professional' 
              ? 'bg-white shadow text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏢 Mode HR/Payroll
        </button>
      </div>

      {mode === 'simple' ? (
        <SimplePPh21Form />
      ) : (
        <ProfessionalPPh21Form />
      )}
    </div>
  );
}
```

**Form Mode Awam — Input yang dimengerti semua orang:**

```tsx
// src/components/pph21/SimplePPh21Form.tsx

export function SimplePPh21Form() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        💡 Isi dengan informasi dari slip gaji Anda. Tidak tahu sesuatu? Biarkan kosong.
      </p>

      <FormField
        label="Gaji Pokok per Bulan"
        tooltip="Gaji tetap yang Anda terima setiap bulan, sebelum tunjangan"
        type="currency"
        name="basicSalary"
      />
      
      <FormField
        label="Total Tunjangan per Bulan"
        tooltip="Jumlah semua tunjangan: transport, makan, kesehatan, dll. Lihat di slip gaji."
        type="currency"
        name="allowances"
      />
      
      <FormField
        label="Bonus / THR (dalam setahun)"
        tooltip="Bonus tahunan + THR yang Anda terima. Jika belum tahu, bisa diisi nanti."
        type="currency"
        name="annualBonus"
        optional
      />
      
      <FormField
        label="Status Pernikahan"
        type="select"
        name="maritalStatus"
        options={[
          { value: 'TK0', label: 'Belum Menikah (TK/0)' },
          { value: 'K0', label: 'Menikah, tidak ada tanggungan (K/0)' },
          { value: 'K1', label: 'Menikah, 1 anak (K/1)' },
          { value: 'K2', label: 'Menikah, 2 anak (K/2)' },
          { value: 'K3', label: 'Menikah, 3 anak atau lebih (K/3)' },
        ]}
      />
      
      {/* Tampilkan field teknis hanya jika pengguna klik "Tampilkan lebih banyak opsi" */}
      <AdvancedOptionsToggle>
        <FormField
          label="Iuran Pensiun / BPJS yang Ditanggung Sendiri"
          tooltip="Biasanya 1% dari gaji untuk BPJS Ketenagakerjaan JHT yang dipotong dari gaji"
          type="currency"
          name="pensionContribution"
          optional
        />
      </AdvancedOptionsToggle>
    </div>
  );
}
```

---

### Step 2 — Sederhanakan Navigasi Sidebar

Dari banyak sub-menu menjadi navigasi flat yang lebih mudah dijangkau:

```tsx
// src/components/Sidebar.tsx — versi disederhanakan

const NAV_ITEMS = [
  // Level 1 — Primary Actions (paling sering dipakai)
  {
    group: 'Utama',
    items: [
      { href: '/dashboard', icon: HomeIcon, label: 'Beranda' },
      { href: '/dashboard/calculator', icon: CalculatorIcon, label: 'Hitung Pajak' },
      { href: '/dashboard/assistant', icon: BotIcon, label: 'Tanya AI' },
    ]
  },
  // Level 2 — Dokumen & Laporan
  {
    group: 'Dokumen',
    items: [
      { href: '/dashboard/reports', icon: FileIcon, label: 'Laporan Saya' },
      { href: '/dashboard/upload', icon: UploadIcon, label: 'Upload Dokumen' },
    ]
  },
  // Level 3 — Tools Lanjutan (dilipat by default di mobile)
  {
    group: 'Lainnya',
    collapsible: true,
    defaultCollapsed: true,
    items: [
      { href: '/dashboard/what-if', icon: FlaskIcon, label: 'Simulasi (What-If)' },
      { href: '/dashboard/calendar', icon: CalendarIcon, label: 'Kalender Pajak' },
      { href: '/dashboard/learn', icon: BookIcon, label: 'Belajar Pajak' },
    ]
  }
];
```

---

### Step 3 — Tambahkan Tooltip/Glossary untuk Istilah Teknis

Buat komponen tooltip yang bisa dipakai di seluruh aplikasi:

```tsx
// src/components/TaxTermTooltip.tsx

const TAX_GLOSSARY: Record<string, string> = {
  'PTKP': 'Penghasilan Tidak Kena Pajak — batas penghasilan yang tidak dikenakan PPh. Tahun 2024: Rp 54 juta/tahun untuk TK/0.',
  'PKP': 'Penghasilan Kena Pajak — penghasilan neto dikurangi PTKP. Inilah yang dihitung pajaknya.',
  'TER': 'Tarif Efektif Rata-Rata — metode pemotongan PPh 21 bulanan yang disederhanakan (berlaku sejak 2024, Januari–November).',
  'NPWP': 'Nomor Pokok Wajib Pajak — identitas pajak Anda, terdiri dari 15 digit.',
  'EFIN': 'Electronic Filing Identification Number — kode untuk akses DJP Online.',
  'natura': 'Fasilitas non-uang dari pemberi kerja, seperti rumah dinas, kendaraan dinas, atau makanan. Sejak 2022, natura termasuk objek PPh.',
  'SPT': 'Surat Pemberitahuan Tahunan — laporan pajak tahunan yang wajib disampaikan ke DJP.',
  'BPN': 'Bukti Penerimaan Negara — tanda terima resmi setelah membayar pajak.',
};

interface TaxTermTooltipProps {
  term: string;
  children: React.ReactNode;
}

export function TaxTermTooltip({ term, children }: TaxTermTooltipProps) {
  const definition = TAX_GLOSSARY[term];
  
  if (!definition) return <>{children}</>;
  
  return (
    <span className="group relative inline-flex items-center gap-1">
      {children}
      <span className="cursor-help text-blue-400 text-xs">ⓘ</span>
      <span className="
        invisible group-hover:visible
        absolute bottom-full left-0 mb-1 z-50
        w-72 p-3 text-xs text-white bg-gray-800 rounded-lg shadow-lg
        pointer-events-none
      ">
        <strong className="block mb-1">{term}</strong>
        {definition}
      </span>
    </span>
  );
}

// Penggunaan:
// <TaxTermTooltip term="PTKP">PTKP</TaxTermTooltip>
// <TaxTermTooltip term="natura">natura dan kenikmatan</TaxTermTooltip>
```

---

### Step 4 — Tambahkan "Panduan Cepat" di Halaman Pertama Kali

Untuk pengguna yang baru pertama kali membuka aplikasi:

```tsx
// src/components/FirstTimeGuide.tsx

export function FirstTimeGuide() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('first_time_guide_dismissed') === 'true'
  );
  
  if (dismissed) return null;
  
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6 mb-6">
      <h2 className="text-lg font-bold mb-2">👋 Selamat Datang di My Tax App!</h2>
      <p className="text-blue-100 text-sm mb-4">
        Baru pertama kali? Berikut yang bisa kamu lakukan:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <QuickStartCard
          icon="🧮"
          title="Hitung Pajak"
          description="Estimasi PPh 21 dari slip gaji kamu"
          href="/dashboard/calculator"
        />
        <QuickStartCard
          icon="🤖"
          title="Tanya AI"
          description="Ada pertanyaan soal pajak? Tanya Feyn"
          href="/dashboard/assistant"
        />
        <QuickStartCard
          icon="📅"
          title="Cek Jadwal"
          description="Lihat deadline lapor dan bayar pajak"
          href="/dashboard/calendar"
        />
      </div>
      
      <button
        onClick={() => {
          localStorage.setItem('first_time_guide_dismissed', 'true');
          setDismissed(true);
        }}
        className="text-blue-200 text-sm hover:text-white"
      >
        Tutup panduan ini →
      </button>
    </div>
  );
}
```

---

## Checklist Perbaikan

- [ ] Mode "Awam" dan "Profesional" diimplementasikan di kalkulator PPh 21
- [ ] Mode serupa diterapkan di kalkulator lain yang memiliki formulir teknis
- [ ] Sidebar disederhanakan (max 2 level, item utama langsung terlihat)
- [ ] Komponen `TaxTermTooltip` dibuat dan digunakan untuk semua istilah teknis
- [ ] Glossary pajak ditambahkan (min. 20 istilah umum)
- [ ] Panduan "Pertama Kali" ditampilkan untuk new user
- [ ] Test dengan pengguna awam: bisa sampai hasil kalkulasi dalam < 3 menit tanpa bantuan
