# **⚙️ Refaktorisasi Tax Engine & Kepatuhan Regulasi UU HPP**

## **Tingkat Keparahan: Kritis (Logika Perhitungan Menyesatkan)**

### **🚨 Mengapa Perhitungan Saat Ini Salah?**

1. **Aturan Eksklusivitas (Pasal 7 UU HPP):** Seseorang yang memiliki penghasilan dari **Pekerjaan Bebas** (misalnya: Dokter, Pengacara, Akuntan, atau Konsultan Independen) **tidak diperbolehkan** menghitung omzet dari usaha dagang/jasanya menggunakan tarif PPh Final UMKM 0.5%. Seluruh penghasilan wajib digabungkan dan dihitung dengan tarif Progresif Pasal 17 menggunakan mekanisme Norma Penghitungan Penghasilan Neto (NPPN) atau Pembukuan.  
2. **Ambang Batas Waktu Insentif (PP 55/2022):**  
   Tarif PPh Final 0.5% bagi Wajib Pajak Orang Pribadi tidak berlaku selamanya. Ada batasan waktu maksimal **7 tahun pajak** sejak WP terdaftar. Tanpa mencatat tahun registrasi UMKM, kalkulator berpotensi salah menghitung kewajiban pajak pengguna.

### **🛠️ Solusi Arsitektural & Perbaikan Kode**

Kami merekomendasikan pembaruan struktur data pada tipe IncomeSource di src/types/taxpayer.ts dengan menambahkan field registrationYearForUmkm.

Berikut adalah kode perbaikan menyeluruh untuk **src/lib/taxEngine.ts** guna mengatasi kedua celah hukum di atas:

import type { IncomeSource } from '@/types/taxpayer';

// Perluas tipe data bawaan untuk mengakomodasi tahun registrasi UMKM  
export interface IncomeSourceEnhanced extends IncomeSource {  
  registrationYearForUmkm?: number; // Tahun pendaftaran/mulai UMKM untuk melacak batas 7 tahun  
}

export type PtkpStatus \= 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3';

export const PTKP\_VALUES: Record\<PtkpStatus, number\> \= {  
  'TK/0': 54\_000\_000,  
  'TK/1': 58\_500\_000,  
  'TK/2': 63\_000\_000,  
  'TK/3': 67\_500\_000,  
  'K/0': 58\_500\_000,  
  'K/1': 63\_000\_000,  
  'K/2': 67\_500\_000,  
  'K/3': 72\_000\_000,  
};

export function normalizePtkpStatus(ptkpStatus: string): PtkpStatus {  
  const status \= ptkpStatus.toUpperCase().replace(/\\s+/g, '');  
  return status in PTKP\_VALUES ? (status as PtkpStatus) : 'TK/0';  
}

export function roundDownTaxableIncome(value: number): number {  
  return Math.floor(Math.max(0, value) / 1000\) \* 1000;  
}

/\*\*  
 \* Menghitung PPh Pasal 17 Orang Pribadi berdasarkan UU HPP (Tahunan)  
 \*/  
export function calculateProgressiveTax(pkp: number): number {  
  if (pkp \<= 0\) return 0;

  let remainingPkp \= pkp;  
  let totalTax \= 0;

  const brackets \= \[  
    { limit: 60000000, rate: 0.05 },  
    { limit: 190000000, rate: 0.15 }, // Lapisan kedua: s.d Rp 250jt (selisih 190jt)  
    { limit: 250000000, rate: 0.25 }, // Lapisan ketiga: s.d Rp 500jt (selisih 250jt)  
    { limit: 4500000000, rate: 0.30 }, // Lapisan keempat: s.d Rp 5M (selisih 4.5M)  
    { limit: Infinity, rate: 0.35 }    // Lapisan kelima: di atas Rp 5M  
  \];

  for (const bracket of brackets) {  
    if (remainingPkp \<= 0\) break;

    const currentChunk \= Math.min(remainingPkp, bracket.limit);  
    totalTax \+= currentChunk \* bracket.rate;  
    remainingPkp \-= currentChunk;  
  }

  return totalTax;  
}

export interface ConsolidatedTaxResultEnhanced {  
  totalGrossProgressive: number;  
  biayaJabatan: number;  
  netProgressive: number;  
  ptkpValue: number;  
  pkp: number;  
  estimatedProgressiveTax: number;  
  totalWithheldCredit: number;  
  netProgressiveTaxDue: number;  
  totalGrossFinal: number;  
  totalFinalTax: number;  
  grandTotalTaxPayable: number;  
  warnings: string\[\]; // Daftar peringatan ketidakpatuhan perpajakan secara legal  
}

/\*\*  
 \* REFAKTORISASI: Menghitung Pajak Konsolidasi Tahunan yang Patuh UU HPP & PP 55/2022  
 \* @param sources Daftar sumber penghasilan wajib pajak (diperluas)  
 \* @param ptkpStatus Status PTKP awal tahun  
 \* @param currentTaxYear Tahun pajak berjalan untuk pelacakan masa berlaku UMKM  
 \*/  
export function calculateConsolidatedTaxEnhanced(  
  sources: IncomeSourceEnhanced\[\],  
  ptkpStatus: string,  
  currentTaxYear: number  
): ConsolidatedTaxResultEnhanced {  
  const ptkpValue \= PTKP\_VALUES\[normalizePtkpStatus(ptkpStatus)\];  
  const warnings: string\[\] \= \[\];

  let totalGrossProgressive \= 0;  
  let totalUsahaOmzet \= 0;  
  let totalSewaOmzet \= 0;  
  let totalInvestasiOmzet \= 0;  
  let totalWithheldCredit \= 0;  
  let pekerjaanTetapGross \= 0;

  // Deteksi dini apakah wajib pajak memiliki penghasilan dari "Pekerjaan Bebas"  
  const hasPekerjaanBebas \= sources.some(source \=\> source.sourceType \=== 'pekerjaan\_bebas');

  for (const source of sources) {  
    if (\['pekerjaan\_tetap', 'pekerjaan\_bebas', 'lainnya'\].includes(source.sourceType)) {  
      totalGrossProgressive \+= source.annualIncome;  
      if (source.sourceType \=== 'pekerjaan\_tetap') {  
        pekerjaanTetapGross \+= source.annualIncome;  
      }  
      if (source.isTaxWithheld) {  
        totalWithheldCredit \+= source.withheldAmount || 0;  
      }  
    } else if (source.sourceType \=== 'usaha') {  
      // 1\. Validasi Aturan Eksklusivitas (Pekerjaan Bebas vs PP 23\)  
      if (hasPekerjaanBebas) {  
        // Omzet usaha dipaksa masuk ke tarif progresif dengan asusmsi Norma NPPN rata-rata 50%  
        const pendapatanNetoAsumsiNorma \= source.annualIncome \* 0.50;  
        totalGrossProgressive \+= pendapatanNetoAsumsiNorma;  
        warnings.push(  
          \`Sumber '${source.sourceName}': Karena Anda memiliki Penghasilan Pekerjaan Bebas, omzet usaha dagang Anda tidak dapat dikenakan skema PPh Final 0.5%. Pendapatan ini telah dialihkan ke perhitungan tarif progresif dengan asumsi tarif NPPN 50%.\`  
        );  
      }   
      // 2\. Validasi Kedaluwarsa Insentif PP 55/2022 (Batas 7 Tahun)  
      else if (source.registrationYearForUmkm && (currentTaxYear \- source.registrationYearForUmkm \> 7)) {  
        totalGrossProgressive \+= source.annualIncome; // Masuk ke progresif penuh tanpa tarif norma UMKM  
        warnings.push(  
          \`Sumber '${source.sourceName}': Masa berlaku insentif PPh Final UMKM 0.5% Anda telah kedaluwarsa (Maksimal 7 Tahun sejak pendaftaran pertama). Omzet usaha dialihkan ke tarif progresif umum.\`  
        );  
      }   
      // Skema legal aman  
      else {  
        totalUsahaOmzet \+= source.annualIncome;  
      }  
    } else if (source.sourceType \=== 'sewa') {  
      totalSewaOmzet \+= source.annualIncome;  
    } else if (source.sourceType \=== 'investasi') {  
      totalInvestasiOmzet \+= source.annualIncome;  
    }  
  }

  // Menghitung Pengurang Biaya Jabatan (5% dari pendapatan kotor pekerjaan tetap, maks Rp 6 Juta per tahun)  
  const biayaJabatan \= Math.min(pekerjaanTetapGross \* 0.05, 6000000);

  // Menghitung Penghasilan Neto Progresif  
  const netProgressive \= Math.max(0, totalGrossProgressive \- biayaJabatan);

  // Menghitung PKP (Penghasilan Kena Pajak) setelah dikurangi PTKP  
  const pkp \= roundDownTaxableIncome(netProgressive \- ptkpValue);

  // Estimasi PPh Progresif Pasal 17  
  const estimatedProgressiveTax \= calculateProgressiveTax(pkp);

  // PPh Kurang Bayar setelah dikurangi Kredit Pajak yang telah dipotong pihak ketiga  
  const netProgressiveTaxDue \= Math.max(0, estimatedProgressiveTax \- totalWithheldCredit);

  // PPh Final UMKM PP 23 dengan pembebasan PTKP Omzet UMKM s.d Rp 500 Juta setahun untuk WP Orang Pribadi  
  const usahaTax \= Math.max(0, (totalUsahaOmzet \- 500000000\) \* 0.005);  
  const sewaTax \= totalSewaOmzet \* 0.10;  
  const investasiTax \= totalInvestasiOmzet \* 0.10; // Asumsi rata-rata dividen final 10%

  const totalGrossFinal \= totalUsahaOmzet \+ totalSewaOmzet \+ totalInvestasiOmzet;  
  const totalFinalTax \= usahaTax \+ sewaTax \+ investasiTax;

  return {  
    totalGrossProgressive,  
    biayaJabatan,  
    netProgressive,  
    ptkpValue,  
    pkp,  
    estimatedProgressiveTax,  
    totalWithheldCredit,  
    netProgressiveTaxDue,  
    totalGrossFinal,  
    totalFinalTax,  
    grandTotalTaxPayable: netProgressiveTaxDue \+ totalFinalTax,  
    warnings,  
  };  
}

### **✅ Langkah Sinkronisasi & Tindakan Lanjutan:**

* \[ \] Buka file src/types/taxpayer.ts dan pastikan interface data IncomeSource mendukung atribut opsional registrationYearForUmkm: number.  
* \[ \] Pada formulir input di src/components/IncomeSourceForm.tsx, tampilkan field *"Tahun Pendaftaran UMKM"* hanya ketika user memilih tipe sumber penghasilan bernilai "usaha".  
* \[ \] Tampilkan daftar array warnings yang dihasilkan fungsi kalkulasi baru ini di sisi frontend Dashboard agar Wajib Pajak menyadari situasi ketidakpatuhan legal mereka secara proaktif.