import type { IncomeSource } from '@/types/taxpayer';

export type PtkpStatus = 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3';

export const PTKP_VALUES: Record<PtkpStatus, number> = {
  'TK/0': 54_000_000,
  'TK/1': 58_500_000,
  'TK/2': 63_000_000,
  'TK/3': 67_500_000,
  'K/0': 58_500_000,
  'K/1': 63_000_000,
  'K/2': 67_500_000,
  'K/3': 72_000_000,
};

export function normalizePtkpStatus(ptkpStatus: string): PtkpStatus {
  const status = ptkpStatus.toUpperCase().replace(/\s+/g, '');
  return status in PTKP_VALUES ? status as PtkpStatus : 'TK/0';
}

export function roundDownTaxableIncome(value: number): number {
  return Math.floor(Math.max(0, value) / 1000) * 1000;
}

/**
 * Menghitung PPh Pasal 17 Orang Pribadi berdasarkan UU HPP (Tahunan)
 * @param pkp Penghasilan Kena Pajak dalam Rupiah (Tahunan)
 * @returns Total PPh Terutang dalam Rupiah
 */
export function calculateProgressiveTax(pkp: number): number {
  if (pkp <= 0) return 0;

  let remainingPkp = pkp;
  let totalTax = 0;

  // Definisi Lapisan Tarif UU HPP
  const brackets = [
    { limit: 60000000, rate: 0.05 },
    { limit: 190000000, rate: 0.15 }, // 250jt - 60jt
    { limit: 250000000, rate: 0.25 }, // 500jt - 250jt
    { limit: 4500000000, rate: 0.30 }, // 5milyar - 500jt
    { limit: Infinity, rate: 0.35 }
  ];

  for (const bracket of brackets) {
    if (remainingPkp <= 0) break;

    const currentChunk = Math.min(remainingPkp, bracket.limit);
    totalTax += currentChunk * bracket.rate;
    remainingPkp -= currentChunk;
  }

  return totalTax;
}

export type TERCategory = 'A' | 'B' | 'C';

/**
 * Menentukan Kategori TER bulanan (A, B, atau C) berdasarkan status PTKP awal tahun
 * @param ptkpStatus Status PTKP (misal: 'TK/0', 'TK/1', 'K/0', 'K/1', 'K/2', 'K/3')
 * @returns Kategori TER
 */
export function getTerCategory(ptkpStatus: string): TERCategory {
  const status = normalizePtkpStatus(ptkpStatus);
  if (['TK/0', 'TK/1', 'K/0'].includes(status)) {
    return 'A';
  } else if (['TK/2', 'TK/3', 'K/1', 'K/2'].includes(status)) {
    return 'B';
  } else if (['K/3'].includes(status)) {
    return 'C';
  }
  return 'A'; // Fallback aman
}

// PP 58/2023 - Lampiran TER Bulanan Kategori A
const TER_A_BRACKETS = [
  { limit: 5400000, rate: 0.00 },
  { limit: 5650000, rate: 0.0025 },
  { limit: 5950000, rate: 0.005 },
  { limit: 6300000, rate: 0.0075 },
  { limit: 6750000, rate: 0.01 },
  { limit: 7500000, rate: 0.0125 },
  { limit: 8550000, rate: 0.015 },
  { limit: 9650000, rate: 0.0175 },
  { limit: 10050000, rate: 0.02 },
  { limit: 10350000, rate: 0.0225 },
  { limit: 10700000, rate: 0.025 },
  { limit: 11050000, rate: 0.03 },
  { limit: 11600000, rate: 0.035 },
  { limit: 12500000, rate: 0.04 },
  { limit: 13750000, rate: 0.05 },
  { limit: 15100000, rate: 0.06 },
  { limit: 16950000, rate: 0.07 },
  { limit: 19750000, rate: 0.08 },
  { limit: 24150000, rate: 0.09 },
  { limit: 26450000, rate: 0.10 },
  { limit: 28000000, rate: 0.11 },
  { limit: 30050000, rate: 0.12 },
  { limit: 32400000, rate: 0.13 },
  { limit: 35400000, rate: 0.14 },
  { limit: 39100000, rate: 0.15 },
  { limit: 43850000, rate: 0.16 },
  { limit: 47800000, rate: 0.17 },
  { limit: 51400000, rate: 0.18 },
  { limit: 56300000, rate: 0.19 },
  { limit: 62200000, rate: 0.20 },
  { limit: 68600000, rate: 0.21 },
  { limit: 77500000, rate: 0.22 },
  { limit: 89000000, rate: 0.23 },
  { limit: 103000000, rate: 0.24 },
  { limit: 125000000, rate: 0.25 },
  { limit: 157000000, rate: 0.26 },
  { limit: 206000000, rate: 0.27 },
  { limit: 337000000, rate: 0.28 },
  { limit: 454000000, rate: 0.29 },
  { limit: 550000000, rate: 0.30 },
  { limit: 695000000, rate: 0.31 },
  { limit: 910000000, rate: 0.32 },
  { limit: 1400000000, rate: 0.33 },
  { limit: Infinity, rate: 0.34 }
];

// PP 58/2023 - Lampiran TER Bulanan Kategori B
const TER_B_BRACKETS = [
  { limit: 6200000, rate: 0.00 },
  { limit: 6500000, rate: 0.0025 },
  { limit: 6850000, rate: 0.005 },
  { limit: 7300000, rate: 0.0075 },
  { limit: 9200000, rate: 0.01 },
  { limit: 10750000, rate: 0.015 },
  { limit: 11250000, rate: 0.02 },
  { limit: 11600000, rate: 0.025 },
  { limit: 12600000, rate: 0.03 },
  { limit: 13600000, rate: 0.04 },
  { limit: 14950000, rate: 0.05 },
  { limit: 16400000, rate: 0.06 },
  { limit: 18450000, rate: 0.07 },
  { limit: 21850000, rate: 0.08 },
  { limit: 26000000, rate: 0.09 },
  { limit: 27700000, rate: 0.10 },
  { limit: 29350000, rate: 0.11 },
  { limit: 31450000, rate: 0.12 },
  { limit: 33950000, rate: 0.13 },
  { limit: 37100000, rate: 0.14 },
  { limit: 41100000, rate: 0.15 },
  { limit: 45800000, rate: 0.16 },
  { limit: 49500000, rate: 0.17 },
  { limit: 53800000, rate: 0.18 },
  { limit: 58500000, rate: 0.19 },
  { limit: 64000000, rate: 0.20 },
  { limit: 71000000, rate: 0.21 },
  { limit: 80000000, rate: 0.22 },
  { limit: 93000000, rate: 0.23 },
  { limit: 109000000, rate: 0.24 },
  { limit: 129000000, rate: 0.25 },
  { limit: 163000000, rate: 0.26 },
  { limit: 211000000, rate: 0.27 },
  { limit: 374000000, rate: 0.28 },
  { limit: 459000000, rate: 0.29 },
  { limit: 555000000, rate: 0.30 },
  { limit: 704000000, rate: 0.31 },
  { limit: 957000000, rate: 0.32 },
  { limit: 1405000000, rate: 0.33 },
  { limit: Infinity, rate: 0.34 }
];

// PP 58/2023 - Lampiran TER Bulanan Kategori C
const TER_C_BRACKETS = [
  { limit: 6600000, rate: 0.00 },
  { limit: 6950000, rate: 0.0025 },
  { limit: 7350000, rate: 0.005 },
  { limit: 7800000, rate: 0.0075 },
  { limit: 8850000, rate: 0.01 },
  { limit: 9800000, rate: 0.0125 },
  { limit: 10950000, rate: 0.015 },
  { limit: 11200000, rate: 0.0175 },
  { limit: 12050000, rate: 0.02 },
  { limit: 12950000, rate: 0.03 },
  { limit: 14150000, rate: 0.04 },
  { limit: 15550000, rate: 0.05 },
  { limit: 17050000, rate: 0.06 },
  { limit: 19500000, rate: 0.07 },
  { limit: 22700000, rate: 0.08 },
  { limit: 26600000, rate: 0.09 },
  { limit: 28100000, rate: 0.10 },
  { limit: 30100000, rate: 0.11 },
  { limit: 32600000, rate: 0.12 },
  { limit: 35400000, rate: 0.13 },
  { limit: 38900000, rate: 0.14 },
  { limit: 43000000, rate: 0.15 },
  { limit: 47400000, rate: 0.16 },
  { limit: 51200000, rate: 0.17 },
  { limit: 55800000, rate: 0.18 },
  { limit: 60400000, rate: 0.19 },
  { limit: 66700000, rate: 0.20 },
  { limit: 74500000, rate: 0.21 },
  { limit: 83200000, rate: 0.22 },
  { limit: 95600000, rate: 0.23 },
  { limit: 110000000, rate: 0.24 },
  { limit: 134000000, rate: 0.25 },
  { limit: 169000000, rate: 0.26 },
  { limit: 221000000, rate: 0.27 },
  { limit: 390000000, rate: 0.28 },
  { limit: 463000000, rate: 0.29 },
  { limit: 561000000, rate: 0.30 },
  { limit: 709000000, rate: 0.31 },
  { limit: 965000000, rate: 0.32 },
  { limit: 1419000000, rate: 0.33 },
  { limit: Infinity, rate: 0.34 }
];

/**
 * Mendapatkan persentase tarif TER bulanan untuk bruto tertentu
 * @param grossMonthly Pendapatan bruto bulanan dalam Rupiah
 * @param ptkpStatus Status PTKP
 * @returns Persentase tarif (misal: 0.0075 untuk 0.75%)
 */
export function getMonthlyTerRate(grossMonthly: number, ptkpStatus: string): number {
  if (grossMonthly <= 0) return 0;

  const category = getTerCategory(ptkpStatus);
  let brackets = TER_A_BRACKETS;
  if (category === 'B') {
    brackets = TER_B_BRACKETS;
  } else if (category === 'C') {
    brackets = TER_C_BRACKETS;
  }

  const matchingBracket = brackets.find(b => grossMonthly <= b.limit);
  return matchingBracket ? matchingBracket.rate : 0;
}

/**
 * Menghitung nominal PPh 21 Bulanan menggunakan Tarif Efektif Rata-rata (TER) PP 58/2023
 * @param grossMonthly Pendapatan bruto bulanan dalam Rupiah
 * @param ptkpStatus Status PTKP (misal: 'TK/0', 'K/1', dll.)
 * @returns Nilai nominal PPh 21 Bulanan terutang dalam Rupiah
 */
export function calculateMonthlyTerTax(grossMonthly: number, ptkpStatus: string): number {
  const rate = getMonthlyTerRate(grossMonthly, ptkpStatus);
  return Math.round(grossMonthly * rate);
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  suggestedMethod?: string;
}

export function validatePPh21TERContext(month: number): ValidationResult {
  if (month === 12) {
    return {
      isValid: false,
      error: 'Metode TER tidak berlaku untuk Masa Desember. Gunakan metode tahunan (Pasal 21 ayat 2 PMK-168/2023).',
      suggestedMethod: 'annual'
    };
  }
  return { isValid: true };
}

// --- PPh 21 Final ---
export type Pph21FinalObject = 'pesangon' | 'pensiun' | 'honorarium_apbn';

export function calculatePph21Final(grossIncome: number, taxObject: Pph21FinalObject, pnsGolongan: string = 'III'): { taxDue: number; ratePercent: number } {
  let taxDue = 0;
  let ratePercent = 0;

  if (taxObject === 'pesangon') {
    if (grossIncome <= 50000000) {
      taxDue = 0;
      ratePercent = 0;
    } else if (grossIncome <= 100000000) {
      taxDue = (grossIncome - 50000000) * 0.05;
      ratePercent = 5;
    } else if (grossIncome <= 500000000) {
      taxDue = (50000000 * 0.05) + ((grossIncome - 100000000) * 0.15);
      ratePercent = 15;
    } else {
      taxDue = (50000000 * 0.05) + (400000000 * 0.15) + ((grossIncome - 500000000) * 0.25);
      ratePercent = 25;
    }
  } else if (taxObject === 'pensiun') {
    if (grossIncome <= 50000000) {
      taxDue = 0;
      ratePercent = 0;
    } else {
      taxDue = (grossIncome - 50000000) * 0.05;
      ratePercent = 5;
    }
  } else if (taxObject === 'honorarium_apbn') {
    if (pnsGolongan === 'I_II') {
      taxDue = 0;
      ratePercent = 0;
    } else if (pnsGolongan === 'III') {
      taxDue = grossIncome * 0.05;
      ratePercent = 5;
    } else if (pnsGolongan === 'IV') {
      taxDue = grossIncome * 0.15;
      ratePercent = 15;
    }
  }

  return { taxDue: Math.round(taxDue), ratePercent };
}

// --- PPh 21 Tidak Final ---
export type Pph21TidakFinalCategory = 
  | '21-100-03'
  | '21-100-04'
  | '21-100-05'
  | '21-100-06'
  | '21-100-07'
  | '21-100-08'
  | '21-100-09'
  | '21-100-10'
  | '21-100-11'
  | '21-100-12'
  | '21-100-13';

export type Pph21TidakFinalJenis = 'non_bulanan' | 'bulanan' | null;

export function calculatePph21TidakFinal(
  grossIncome: number, 
  category: Pph21TidakFinalCategory, 
  hasNpwp: boolean, 
  jenis: Pph21TidakFinalJenis = null
): { dpp: number; taxDue: number; ratePercent: number } {
  let dpp = 0;
  
  // DPP 50% untuk distributor MLM, agen asuransi, penjaja barang, tenaga ahli, seniman, bukan pegawai lainnya
  if (['21-100-04', '21-100-05', '21-100-06', '21-100-07', '21-100-08', '21-100-09'].includes(category)) {
    dpp = grossIncome * 0.5;
  } else {
    // DPP 100% untuk dewan komisaris, mantan pegawai, penarikan pensiun, peserta kegiatan, pegawai tidak tetap
    dpp = grossIncome;
  }

  // Tarif Pasal 17
  let ratePercent = 5;
  if (dpp <= 60000000) ratePercent = 5;
  else if (dpp <= 250000000) ratePercent = 15;
  else if (dpp <= 500000000) ratePercent = 25;
  else if (dpp <= 5000000000) ratePercent = 30;
  else ratePercent = 35;

  let finalRate = ratePercent / 100;
  
  // Tanpa NPWP dikenakan tarif 20% lebih tinggi
  if (!hasNpwp) {
    finalRate = finalRate * 1.2;
  }

  const taxDue = dpp * finalRate;

  return { dpp, taxDue: Math.round(taxDue), ratePercent: hasNpwp ? ratePercent : ratePercent * 1.2 };
}

export interface Pph21AnnualInput {
  grossIncome: number;
  ptkpStatus: string;
  pensionContribution?: number;
  religiousContribution?: number;
  previousNetIncome?: number;
  withheldTaxCredit?: number;
}

export interface Pph21AnnualResult {
  grossIncome: number;
  jobExpense: number;
  pensionContribution: number;
  religiousContribution: number;
  totalDeduction: number;
  currentNetIncome: number;
  previousNetIncome: number;
  netIncomeForTax: number;
  ptkpValue: number;
  taxableIncome: number;
  annualTax: number;
  withheldTaxCredit: number;
  taxDue: number;
  overpaidTax: number;
}

export function calculateAnnualPph21({
  grossIncome,
  ptkpStatus,
  pensionContribution = 0,
  religiousContribution = 0,
  previousNetIncome = 0,
  withheldTaxCredit = 0,
}: Pph21AnnualInput): Pph21AnnualResult {
  const safeGrossIncome = Math.max(0, grossIncome);
  const safePensionContribution = Math.max(0, pensionContribution);
  const safeReligiousContribution = Math.max(0, religiousContribution);
  const safePreviousNetIncome = Math.max(0, previousNetIncome);
  const safeWithheldTaxCredit = Math.max(0, withheldTaxCredit);
  const ptkpValue = PTKP_VALUES[normalizePtkpStatus(ptkpStatus)];
  const jobExpense = Math.min(safeGrossIncome * 0.05, 6_000_000);
  const totalDeduction = jobExpense + safePensionContribution + safeReligiousContribution;
  const currentNetIncome = Math.max(0, safeGrossIncome - totalDeduction);
  const netIncomeForTax = currentNetIncome + safePreviousNetIncome;
  const taxableIncome = roundDownTaxableIncome(netIncomeForTax - ptkpValue);
  const annualTax = Math.round(calculateProgressiveTax(taxableIncome));
  const taxDue = Math.max(0, annualTax - safeWithheldTaxCredit);
  const overpaidTax = Math.max(0, safeWithheldTaxCredit - annualTax);

  return {
    grossIncome: safeGrossIncome,
    jobExpense,
    pensionContribution: safePensionContribution,
    religiousContribution: safeReligiousContribution,
    totalDeduction,
    currentNetIncome,
    previousNetIncome: safePreviousNetIncome,
    netIncomeForTax,
    ptkpValue,
    taxableIncome,
    annualTax,
    withheldTaxCredit: safeWithheldTaxCredit,
    taxDue,
    overpaidTax,
  };
}

export interface ConsolidatedTaxResult {
  totalGrossProgressive: number;
  pekerjaanTetapGross: number;
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
  warnings: string[];
}

/**
 * Menghitung Pajak Konsolidasi Tahunan dari berbagai sumber penghasilan
 * @param sources Daftar sumber penghasilan wajib pajak
 * @param ptkpStatus Status PTKP awal tahun (TK/0, K/1, dll)
 * @param currentTaxYear Tahun pajak berjalan untuk pelacakan masa berlaku UMKM
 * @returns Rangkian hasil perhitungan pajak gabungan progresif dan final
 */
export function calculateConsolidatedTax(
  sources: IncomeSource[],
  ptkpStatus: string,
  currentTaxYear: number = new Date().getFullYear()
): ConsolidatedTaxResult {
  const ptkpValue = PTKP_VALUES[normalizePtkpStatus(ptkpStatus)];
  const warnings: string[] = [];

  let totalGrossProgressive = 0;
  let totalUsahaOmzet = 0;
  let totalSewaOmzet = 0;
  let totalInvestasiOmzet = 0;
  let totalWithheldCredit = 0;
  let pekerjaanTetapGross = 0;

  // Deteksi dini apakah wajib pajak memiliki penghasilan dari "Pekerjaan Bebas"
  const hasPekerjaanBebas = sources.some(source => source.sourceType === 'pekerjaan_bebas');

  for (const source of sources) {
    if (['pekerjaan_tetap', 'pekerjaan_bebas', 'lainnya'].includes(source.sourceType)) {
      totalGrossProgressive += source.annualIncome;
      if (source.sourceType === 'pekerjaan_tetap') {
        pekerjaanTetapGross += source.annualIncome;
      }
      if (source.isTaxWithheld) {
        totalWithheldCredit += source.withheldAmount || 0;
      }
    } else if (source.sourceType === 'usaha') {
      // 1. Validasi Aturan Eksklusivitas (Pekerjaan Bebas vs PP 23)
      if (hasPekerjaanBebas) {
        // Omzet usaha dipaksa masuk ke tarif progresif dengan asusmsi Norma NPPN rata-rata 50%
        const pendapatanNetoAsumsiNorma = source.annualIncome * 0.50;
        totalGrossProgressive += pendapatanNetoAsumsiNorma;
        warnings.push(
          `Sumber '${source.sourceName}': Karena Anda memiliki Penghasilan Pekerjaan Bebas, omzet usaha dagang Anda tidak dapat dikenakan skema PPh Final 0.5%. Pendapatan ini telah dialihkan ke perhitungan tarif progresif dengan asumsi tarif NPPN 50%.`
        );
      } 
      // 2. Validasi Kedaluwarsa Insentif PP 55/2022 (Batas 7 Tahun)
      else if (source.registrationYearForUmkm && (currentTaxYear - source.registrationYearForUmkm > 7)) {
        totalGrossProgressive += source.annualIncome; // Masuk ke progresif penuh tanpa tarif norma UMKM
        warnings.push(
          `Sumber '${source.sourceName}': Masa berlaku insentif PPh Final UMKM 0.5% Anda telah kedaluwarsa (Maksimal 7 Tahun sejak pendaftaran pertama). Omzet usaha dialihkan ke tarif progresif umum.`
        );
      } 
      // Skema legal aman
      else {
        totalUsahaOmzet += source.annualIncome;
      }
    } else if (source.sourceType === 'sewa') {
      totalSewaOmzet += source.annualIncome;
    } else if (source.sourceType === 'investasi') {
      totalInvestasiOmzet += source.annualIncome;
    }
  }

  // Biaya Jabatan (5% dari bruto pekerjaan tetap, maksimal 6.000.000 setahun)
  const biayaJabatan = Math.min(pekerjaanTetapGross * 0.05, 6000000);

  // Penghasilan Neto Progresif
  const netProgressive = Math.max(0, totalGrossProgressive - biayaJabatan);

  // PKP (Penghasilan Kena Pajak)
  const pkp = roundDownTaxableIncome(netProgressive - ptkpValue);

  // PPh Terutang Progresif (UU HPP Pasal 17)
  const estimatedProgressiveTax = calculateProgressiveTax(pkp);

  // PPh Kurang Bayar (setelah dikurangi Kredit Pajak / PPh yang dipotong pihak lain)
  const netProgressiveTaxDue = Math.max(0, estimatedProgressiveTax - totalWithheldCredit);

  // Pajak Final
  // 1. UMKM PP 23 (Tarif 0.5% dengan pembebasan PTKP Omzet s.d Rp 500 Juta setahun bagi OP)
  const usahaTax = Math.max(0, (totalUsahaOmzet - 500000000) * 0.005);
  // 2. Sewa Tanah/Bangunan (Final 10%)
  const sewaTax = totalSewaOmzet * 0.10;
  // 3. Investasi Dividen/Bunga (Final Rata-rata 10%)
  const investasiTax = totalInvestasiOmzet * 0.10;

  const totalGrossFinal = totalUsahaOmzet + totalSewaOmzet + totalInvestasiOmzet;
  const totalFinalTax = usahaTax + sewaTax + investasiTax;

  const grandTotalTaxPayable = netProgressiveTaxDue + totalFinalTax;

  return {
    totalGrossProgressive,
    pekerjaanTetapGross,
    biayaJabatan,
    netProgressive,
    ptkpValue,
    pkp,
    estimatedProgressiveTax,
    totalWithheldCredit,
    netProgressiveTaxDue,
    totalGrossFinal,
    totalFinalTax,
    grandTotalTaxPayable,
    warnings,
  };
}

/**
 * Kalkulasi PPh UMKM PP 23 (Final 0.5%) dengan threshold Rp 500 juta bebas pajak untuk WPOP
 * @param annualOmzet Omzet tahunan dalam Rupiah
 * @returns PPh UMKM Terutang
 */
export function calculateUmkmTax(annualOmzet: number): number {
  if (annualOmzet <= 500000000) return 0;
  return (annualOmzet - 500000000) * 0.005;
}

export type VatMode = 'non_luxury_2025' | 'standard' | '11_percent' | '12_percent';

export interface VatResult {
  dpp: number;
  rate: number;
  effectiveRate: number;
  tax: number;
}

/**
 * Menghitung PPN dengan opsi sudah termasuk pajak atau belum.
 */
export function calculateVat(amount: number, mode: VatMode = '11_percent', includeTax = false): VatResult {
  const safeAmount = Math.max(0, amount);
  const rate = mode === 'standard' || mode === '12_percent' ? 0.12 : 0.11;
  
  let dpp = safeAmount;
  if (includeTax) {
    dpp = safeAmount / (1 + rate);
  }

  const tax = Math.round(dpp * rate);

  return {
    dpp: Math.round(dpp),
    rate,
    effectiveRate: rate,
    tax,
  };
}

export type Pph23Object = 'royalty_dividend_interest' | 'service_rent';

export interface WithholdingTaxResult {
  base: number;
  rate: number;
  tax: number;
}

export function calculatePph23(amount: number, object: Pph23Object, withoutNpwp = false, isGrossUp = false): WithholdingTaxResult {
  const baseAmount = Math.max(0, amount);
  const baseRate = object === 'royalty_dividend_interest' ? 0.15 : 0.02;
  const rate = withoutNpwp ? baseRate * 2 : baseRate;

  let dpp = baseAmount;
  if (isGrossUp) {
    dpp = baseAmount / (1 - rate);
  }

  return {
    base: Math.round(dpp),
    rate,
    tax: Math.round(dpp * rate),
  };
}

export type Pph26Object = 'gross_income' | 'asset_transfer' | 'insurance_premium';

export function calculatePph26(amount: number, object: Pph26Object = 'gross_income', treatyRate?: number, isGrossUp = false): WithholdingTaxResult {
  const base = Math.max(0, amount);
  const treaty = treatyRate !== undefined ? Math.min(Math.max(treatyRate, 0), 1) : undefined;
  let rate = treaty ?? 0.20;
  let taxableBase = base;

  if (object === 'asset_transfer') {
    rate = treaty ?? 0.20;
    taxableBase = base * 0.25;
  } else if (object === 'insurance_premium') {
    rate = treaty ?? 0.20;
    taxableBase = base * 0.50;
  }

  if (isGrossUp) {
    const effectiveRate = object === 'asset_transfer' ? rate * 0.25 : object === 'insurance_premium' ? rate * 0.50 : rate;
    const grossedUpBase = base / (1 - effectiveRate);
    taxableBase = object === 'asset_transfer' ? grossedUpBase * 0.25 : object === 'insurance_premium' ? grossedUpBase * 0.50 : grossedUpBase;
  }

  return {
    base: Math.round(taxableBase),
    rate,
    tax: Math.round(taxableBase * rate),
  };
}

export type FinalTaxObject = 'umkm_individual' | 'umkm_entity' | 'land_building_rent' | 'land_building_transfer';

export function calculateFinalTax(amount: number, object: FinalTaxObject, isGrossUp = false): WithholdingTaxResult {
  const base = Math.max(0, amount);
  let taxableBase = base;
  let rate = 0.005;

  if (object === 'umkm_individual') {
    taxableBase = Math.max(0, base - 500000000);
  } else if (object === 'land_building_rent') {
    rate = 0.10;
  } else if (object === 'land_building_transfer') {
    rate = 0.025;
  }

  if (isGrossUp && object !== 'umkm_individual') {
    taxableBase = base / (1 - rate);
  }

  return {
    base: Math.round(taxableBase),
    rate,
    tax: Math.round(taxableBase * rate),
  };
}

export interface CorporateTaxResult {
  mode: CorporateTaxMode;
  taxableIncome: number;
  grossTurnover: number;
  facilityIncome: number;
  normalIncome: number;
  rate: number;
  tax: number;
  effectiveRate: number;
}

export type CorporateTaxMode = 'general' | 'public_company' | 'umkm_final';

export function calculateCorporateIncomeTax(
  taxableIncome: number,
  grossTurnover: number,
  useSmallBusinessFacility = true,
  mode: CorporateTaxMode = 'general'
): CorporateTaxResult {
  const safeTaxableIncome = Math.max(0, taxableIncome);
  const safeGrossTurnover = Math.max(0, grossTurnover);
  const normalRate = 0.22;

  if (mode === 'public_company') {
    const publicCompanyRate = 0.19;
    const tax = Math.round(safeTaxableIncome * publicCompanyRate);

    return {
      mode,
      taxableIncome: safeTaxableIncome,
      grossTurnover: safeGrossTurnover,
      facilityIncome: 0,
      normalIncome: safeTaxableIncome,
      rate: publicCompanyRate,
      tax,
      effectiveRate: safeTaxableIncome > 0 ? tax / safeTaxableIncome : 0,
    };
  }

  if (mode === 'umkm_final') {
    const finalRate = 0.005;
    const tax = Math.round(safeGrossTurnover * finalRate);

    return {
      mode,
      taxableIncome: safeTaxableIncome,
      grossTurnover: safeGrossTurnover,
      facilityIncome: safeGrossTurnover,
      normalIncome: 0,
      rate: finalRate,
      tax,
      effectiveRate: safeGrossTurnover > 0 ? tax / safeGrossTurnover : 0,
    };
  }

  const facilityRate = normalRate * 0.5;

  let facilityIncome = 0;
  if (useSmallBusinessFacility && safeGrossTurnover > 0 && safeGrossTurnover <= 50000000000) {
    const facilityRatio = Math.min(4800000000 / safeGrossTurnover, 1);
    facilityIncome = safeTaxableIncome * facilityRatio;
  }

  const normalIncome = Math.max(0, safeTaxableIncome - facilityIncome);
  const tax = Math.round((facilityIncome * facilityRate) + (normalIncome * normalRate));

  return {
    mode,
    taxableIncome: safeTaxableIncome,
    grossTurnover: safeGrossTurnover,
    facilityIncome,
    normalIncome,
    rate: normalRate,
    tax,
    effectiveRate: safeTaxableIncome > 0 ? tax / safeTaxableIncome : 0,
  };
}

export function calculateStampDuty(documentValue: number): number {
  return documentValue > 5000000 ? 10000 : 0;
}

export type PpnBmRateBand = '10' | '20' | '40' | '50' | '75';

export function calculatePpnBm(amount: number, rateBand: PpnBmRateBand, includeTax = false): WithholdingTaxResult {
  const baseAmount = Math.max(0, amount);
  const rate = Number(rateBand) / 100;

  let dpp = baseAmount;
  if (includeTax) {
    dpp = baseAmount / (1 + rate);
  }

  return {
    base: Math.round(dpp),
    rate,
    tax: Math.round(dpp * rate),
  };
}

export interface BphtbResult {
  npop: number;
  npoptkp: number;
  taxableBase: number;
  rate: number;
  tax: number;
  disclaimer: string | null;
}

const BPHTB_RATES_BY_REGION: Record<string, number> = {
  'DKI JAKARTA': 0.05,
  'SURABAYA': 0.05,
  'BANDUNG': 0.05,
  'DEFAULT': 0.05, // fallback dengan disclaimer
};

export function calculateBphtb(transactionValue: number, njop: number, npoptkp = 80000000, region: string = 'DEFAULT'): BphtbResult {
  const npop = Math.max(Math.max(0, transactionValue), Math.max(0, njop));
  const safeNpoptkp = Math.max(0, npoptkp);
  
  const regionKey = region.toUpperCase();
  const rate = BPHTB_RATES_BY_REGION[regionKey] ?? BPHTB_RATES_BY_REGION['DEFAULT'];
  const isDefaultRate = !BPHTB_RATES_BY_REGION[regionKey];
  
  const taxableBase = Math.max(0, npop - safeNpoptkp);

  return {
    npop,
    npoptkp: safeNpoptkp,
    taxableBase,
    rate,
    tax: Math.round(taxableBase * rate),
    disclaimer: isDefaultRate 
      ? `Tarif 5% digunakan sebagai estimasi. Tarif BPHTB untuk ${region} dapat berbeda berdasarkan Perda setempat. Verifikasi ke BPRD/BPKD daerah Anda.`
      : null
  };
}

export type LocalTaxObject =
  | 'pbb_p2'
  | 'pkb_first'
  | 'pkb_progressive_max'
  | 'bbnkb'
  | 'pbjt_general'
  | 'pbjt_specific_entertainment'
  | 'reklame'
  | 'air_tanah'
  | 'pbbkb'
  | 'rokok'
  | 'mblb'
  | 'sarang_burung_walet';

export interface LocalTaxResult {
  base: number;
  rate: number;
  tax: number;
}

export function getDefaultLocalTaxRate(object: LocalTaxObject): number {
  const rates: Record<LocalTaxObject, number> = {
    pbb_p2: 0.005,
    pkb_first: 0.012,
    pkb_progressive_max: 0.06,
    bbnkb: 0.12,
    pbjt_general: 0.10,
    pbjt_specific_entertainment: 0.40,
    reklame: 0.25,
    air_tanah: 0.20,
    pbbkb: 0.10,
    rokok: 0.10,
    mblb: 0.20,
    sarang_burung_walet: 0.10,
  };

  return rates[object];
}

export function calculateLocalTax(baseAmount: number, object: LocalTaxObject, customRate?: number): LocalTaxResult {
  const base = Math.max(0, baseAmount);
  const rate = customRate === undefined ? getDefaultLocalTaxRate(object) : Math.min(Math.max(customRate, 0), 1);

  return {
    base,
    rate,
    tax: Math.round(base * rate),
  };
}

export interface PbbP2Result {
  njop: number;
  njoptkp: number;
  taxableBase: number;
  rate: number;
  tax: number;
}

export function calculatePbbP2(njop: number, njoptkp = 10000000, rate = 0.005): PbbP2Result {
  const safeNjop = Math.max(0, njop);
  const safeNjoptkp = Math.max(0, njoptkp);
  const safeRate = Math.min(Math.max(rate, 0), 1);
  const taxableBase = Math.max(0, safeNjop - safeNjoptkp);

  return {
    njop: safeNjop,
    njoptkp: safeNjoptkp,
    taxableBase,
    rate: safeRate,
    tax: Math.round(taxableBase * safeRate),
  };
}

export type TaxPenaltyObject =
  | 'late_spt_annual_individual'
  | 'late_spt_annual_corporate'
  | 'late_spt_vat_period'
  | 'late_spt_other_period'
  | 'interest_collection'
  | 'interest_correction_late_payment'
  | 'interest_disclosure'
  | 'interest_skpkb'
  | 'interest_skpkb_additional';

export interface TaxPenaltyResult {
  base: number;
  months: number;
  rate: number;
  fixedFine: number;
  penalty: number;
}

const MAY_2026_SANCTION_INTEREST_RATES: Record<Extract<TaxPenaltyObject,
  | 'interest_collection'
  | 'interest_correction_late_payment'
  | 'interest_disclosure'
  | 'interest_skpkb'
  | 'interest_skpkb_additional'
>, number> = {
  interest_collection: 0.0055,
  interest_correction_late_payment: 0.0097,
  interest_disclosure: 0.0139,
  interest_skpkb: 0.0180,
  interest_skpkb_additional: 0.0222,
};

const FIXED_TAX_FINES: Record<Extract<TaxPenaltyObject,
  | 'late_spt_annual_individual'
  | 'late_spt_annual_corporate'
  | 'late_spt_vat_period'
  | 'late_spt_other_period'
>, number> = {
  late_spt_annual_individual: 100000,
  late_spt_annual_corporate: 1000000,
  late_spt_vat_period: 500000,
  late_spt_other_period: 100000,
};

export function calculateTaxPenalty(baseAmount: number, object: TaxPenaltyObject, months = 1): TaxPenaltyResult {
  const base = Math.max(0, baseAmount);
  const safeMonths = Math.min(Math.max(Math.ceil(months), 0), 24);

  if (object in FIXED_TAX_FINES) {
    const fixedFine = FIXED_TAX_FINES[object as keyof typeof FIXED_TAX_FINES];

    return {
      base,
      months: 0,
      rate: 0,
      fixedFine,
      penalty: fixedFine,
    };
  }

  const rate = MAY_2026_SANCTION_INTEREST_RATES[object as keyof typeof MAY_2026_SANCTION_INTEREST_RATES];
  const penalty = Math.round(base * rate * safeMonths);

  return {
    base,
    months: safeMonths,
    rate,
    fixedFine: 0,
    penalty,
  };
}

export type PphUnificationObject =
  | 'pph22_government_goods'
  | 'pph22_import_api'
  | 'pph22_import_non_api'
  | 'pph22_luxury_goods'
  | 'pph23_service_rent'
  | 'pph23_royalty_dividend_interest'
  | 'pph4_land_building_transfer'
  | 'pph4_land_building_rent'
  | 'pph15_domestic_shipping'
  | 'pph26_gross_income';

export function calculatePphUnification(amount: number, object: PphUnificationObject, withoutNpwp = false, isGrossUp = false): WithholdingTaxResult {
  const base = Math.max(0, amount);
  let rate = 0.02;
  let taxableBase = base;
  let canDoubleWithoutNpwp = false;

  if (object === 'pph22_government_goods') {
    rate = 0.015;
    canDoubleWithoutNpwp = true;
  } else if (object === 'pph22_import_api') {
    rate = 0.025;
    canDoubleWithoutNpwp = true;
  } else if (object === 'pph22_import_non_api') {
    rate = 0.075;
    canDoubleWithoutNpwp = true;
  } else if (object === 'pph22_luxury_goods') {
    rate = 0.05;
    canDoubleWithoutNpwp = true;
  } else if (object === 'pph23_service_rent') {
    rate = 0.02;
    canDoubleWithoutNpwp = true;
  } else if (object === 'pph23_royalty_dividend_interest') {
    rate = 0.15;
    canDoubleWithoutNpwp = true;
  } else if (object === 'pph4_land_building_transfer') {
    rate = 0.025;
  } else if (object === 'pph4_land_building_rent') {
    rate = 0.10;
  } else if (object === 'pph15_domestic_shipping') {
    rate = 0.012;
  } else if (object === 'pph26_gross_income') {
    rate = 0.20;
  }

  if (withoutNpwp && canDoubleWithoutNpwp) {
    rate *= 2;
  }

  if (isGrossUp) {
    taxableBase = base / (1 - rate);
  }

  return {
    base: Math.round(taxableBase),
    rate,
    tax: Math.round(taxableBase * rate),
  };
}

/**
 * Validasi pengurang tambahan (Zakat, Donasi)
 * Berdasarkan aturan, maksimal biasanya dibatasi (misal 5% dari bruto). Di sini kita terapkan batasan umum.
 * @param bruto Penghasilan bruto total
 * @param deductions Jumlah pengurang yang dimasukkan pengguna
 * @returns Pengurang yang valid untuk dikurangkan dari bruto
 */
export function calculateAdditionalDeductions(bruto: number, deductions: number): number {
  if (deductions <= 0) return 0;
  // Capping deduction to maximum 5% of gross income as a safe heuristic for simulation
  const maxDeduction = bruto * 0.05;
  return Math.min(deductions, maxDeduction);
}

/**
 * Membandingkan 2 hasil skenario pajak
 * @param baseTax Total pajak skenario awal
 * @param simTax Total pajak skenario simulasi
 * @returns Selisih (diff) dan Persentase Penghematan (pct)
 */
export function compareScenarios(baseTax: number, simTax: number): { diff: number; pct: number } {
  const diff = baseTax - simTax;
  let pct = 0;
  
  if (baseTax > 0) {
    pct = (diff / baseTax) * 100;
  } else if (baseTax === 0 && simTax > 0) {
    // Jika base 0 tapi simTax ada, berarti rugi/nambah pajak.
    pct = -100;
  }
  
  return { diff, pct };
}

export function calculateFiscalDepreciation(acquisitionValue: number, acquisitionYear: number, currentYear: number, assetType: string, assetName: string): number {
  if (acquisitionValue <= 0 || currentYear < acquisitionYear) return acquisitionValue;
  const yearsElapsed = currentYear - acquisitionYear;
  if (yearsElapsed === 0) return acquisitionValue;
  let usefulLife = 0;
  const nameLower = (assetName || '').toLowerCase();
  switch (assetType) {
    case 'kendaraan':
      if (nameLower.includes('motor') || nameLower.includes('sepeda')) { usefulLife = 4; } else { usefulLife = 8; }
      break;
    case 'peralatan':
      usefulLife = 4;
      break;
    case 'tanah_bangunan':
      if (nameLower.includes('tanah') && !nameLower.includes('bangunan') && !nameLower.includes('rumah')) {
        usefulLife = 0;
      } else {
        usefulLife = 20;
      }
      break;
    default:
      usefulLife = 0;
      break;
  }
  if (usefulLife === 0) return acquisitionValue;
  const depreciationRate = 1 / usefulLife;
  const totalDepreciation = acquisitionValue * depreciationRate * yearsElapsed;
  const bookValue = acquisitionValue - totalDepreciation;
  return Math.max(0, bookValue);
}

export function getAssetFiscalGroup(assetType: string, assetName: string): string {
  const nameLower = (assetName || '').toLowerCase();
  switch (assetType) {
    case 'kendaraan':
      return (nameLower.includes('motor') || nameLower.includes('sepeda')) ? 'Kelompok 1 (4 Tahun)' : 'Kelompok 2 (8 Tahun)';
    case 'peralatan':
      return 'Kelompok 1 (4 Tahun)';
    case 'tanah_bangunan':
      return (nameLower.includes('tanah') && !nameLower.includes('bangunan') && !nameLower.includes('rumah')) ? 'Tidak Disusutkan' : 'Bangunan (20 Tahun)';
    default:
      return 'Tidak Disusutkan';
  }
}
