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
  { limit: 9650000, rate: 0.02 },
  { limit: 10950000, rate: 0.025 },
  { limit: 13000000, rate: 0.03 },
  { limit: 15000000, rate: 0.05 },
  { limit: 19000000, rate: 0.06 },
  { limit: 22600000, rate: 0.07 },
  { limit: 26000000, rate: 0.08 },
  { limit: 30000000, rate: 0.09 },
  { limit: 36000000, rate: 0.10 },
  { limit: 42000000, rate: 0.12 },
  { limit: 49000000, rate: 0.15 },
  { limit: 56000000, rate: 0.17 },
  { limit: 64000000, rate: 0.19 },
  { limit: 75000000, rate: 0.21 },
  { limit: 87000000, rate: 0.23 },
  { limit: 100000000, rate: 0.24 },
  { limit: 151000000, rate: 0.25 },
  { limit: 263000000, rate: 0.26 },
  { limit: 378000000, rate: 0.27 },
  { limit: 516000000, rate: 0.28 },
  { limit: 714000000, rate: 0.29 },
  { limit: 1002000000, rate: 0.31 },
  { limit: 1400000000, rate: 0.32 },
  { limit: Infinity, rate: 0.34 }
];

// PP 58/2023 - Lampiran TER Bulanan Kategori B
const TER_B_BRACKETS = [
  { limit: 6200000, rate: 0.00 },
  { limit: 6500000, rate: 0.0025 },
  { limit: 6850000, rate: 0.005 },
  { limit: 7300000, rate: 0.0075 },
  { limit: 7800000, rate: 0.01 },
  { limit: 8500000, rate: 0.0125 },
  { limit: 9600000, rate: 0.015 },
  { limit: 10700000, rate: 0.02 },
  { limit: 12200000, rate: 0.025 },
  { limit: 14000000, rate: 0.03 },
  { limit: 16000000, rate: 0.04 },
  { limit: 19000000, rate: 0.05 },
  { limit: 23000000, rate: 0.06 },
  { limit: 27000000, rate: 0.07 },
  { limit: 31000000, rate: 0.08 },
  { limit: 37000000, rate: 0.09 },
  { limit: 43000000, rate: 0.10 },
  { limit: 48000000, rate: 0.12 },
  { limit: 54000000, rate: 0.15 },
  { limit: 61000000, rate: 0.17 },
  { limit: 69000000, rate: 0.19 },
  { limit: 80000000, rate: 0.21 },
  { limit: 92000000, rate: 0.23 },
  { limit: 107000000, rate: 0.24 },
  { limit: 161000000, rate: 0.25 },
  { limit: 277000000, rate: 0.26 },
  { limit: 396000000, rate: 0.27 },
  { limit: 538000000, rate: 0.28 },
  { limit: 745000000, rate: 0.29 },
  { limit: 1045000000, rate: 0.31 },
  { limit: 1455000000, rate: 0.32 },
  { limit: Infinity, rate: 0.34 }
];

// PP 58/2023 - Lampiran TER Bulanan Kategori C
const TER_C_BRACKETS = [
  { limit: 6600000, rate: 0.00 },
  { limit: 6950000, rate: 0.0025 },
  { limit: 7350000, rate: 0.005 },
  { limit: 7800000, rate: 0.0075 },
  { limit: 8300000, rate: 0.01 },
  { limit: 9000000, rate: 0.0125 },
  { limit: 10050000, rate: 0.015 },
  { limit: 11200000, rate: 0.02 },
  { limit: 12800000, rate: 0.025 },
  { limit: 15100000, rate: 0.03 },
  { limit: 16900000, rate: 0.04 },
  { limit: 19700000, rate: 0.05 },
  { limit: 24100000, rate: 0.06 },
  { limit: 28500000, rate: 0.07 },
  { limit: 33000000, rate: 0.08 },
  { limit: 38600000, rate: 0.09 },
  { limit: 44600000, rate: 0.10 },
  { limit: 50200000, rate: 0.12 },
  { limit: 56400000, rate: 0.15 },
  { limit: 63600000, rate: 0.17 },
  { limit: 72400000, rate: 0.19 },
  { limit: 84100000, rate: 0.21 },
  { limit: 96500000, rate: 0.23 },
  { limit: 111400000, rate: 0.24 },
  { limit: 167000000, rate: 0.25 },
  { limit: 286700000, rate: 0.26 },
  { limit: 410500000, rate: 0.27 },
  { limit: 558200000, rate: 0.28 },
  { limit: 772300000, rate: 0.29 },
  { limit: 1083100000, rate: 0.31 },
  { limit: 1510000000, rate: 0.32 },
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
}

/**
 * Menghitung Pajak Konsolidasi Tahunan dari berbagai sumber penghasilan
 * @param sources Daftar sumber penghasilan wajib pajak
 * @param ptkpStatus Status PTKP awal tahun (TK/0, K/1, dll)
 * @returns Rangkian hasil perhitungan pajak gabungan progresif dan final
 */
export function calculateConsolidatedTax(
  sources: IncomeSource[],
  ptkpStatus: string
): ConsolidatedTaxResult {
  const ptkpValue = PTKP_VALUES[normalizePtkpStatus(ptkpStatus)];

  let totalGrossProgressive = 0;
  let totalUsahaOmzet = 0;
  let totalSewaOmzet = 0;
  let totalInvestasiOmzet = 0;
  let totalWithheldCredit = 0;
  let pekerjaanTetapGross = 0;

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
      totalUsahaOmzet += source.annualIncome;
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

export type VatMode = 'standard' | 'non_luxury_2025';

export interface VatResult {
  dpp: number;
  rate: number;
  effectiveRate: number;
  tax: number;
}

/**
 * Menghitung PPN. Mulai 2025 tarif umum 12%, dengan DPP nilai lain 11/12
 * untuk BKP/JKP non-mewah sehingga beban efektif tetap 11%.
 */
export function calculateVat(amount: number, mode: VatMode = 'non_luxury_2025'): VatResult {
  const safeAmount = Math.max(0, amount);
  const rate = 0.12;
  const dpp = mode === 'non_luxury_2025' ? safeAmount * (11 / 12) : safeAmount;
  const tax = Math.round(dpp * rate);

  return {
    dpp,
    rate,
    effectiveRate: safeAmount > 0 ? tax / safeAmount : 0,
    tax,
  };
}

export type Pph23Object = 'royalty_dividend_interest' | 'service_rent';

export interface WithholdingTaxResult {
  base: number;
  rate: number;
  tax: number;
}

export function calculatePph23(amount: number, object: Pph23Object, withoutNpwp = false): WithholdingTaxResult {
  const base = Math.max(0, amount);
  const baseRate = object === 'royalty_dividend_interest' ? 0.15 : 0.02;
  const rate = withoutNpwp ? baseRate * 2 : baseRate;

  return {
    base,
    rate,
    tax: Math.round(base * rate),
  };
}

export type Pph26Object = 'gross_income' | 'asset_transfer' | 'insurance_premium';

export function calculatePph26(amount: number, object: Pph26Object = 'gross_income', treatyRate?: number): WithholdingTaxResult {
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

  return {
    base: taxableBase,
    rate,
    tax: Math.round(taxableBase * rate),
  };
}

export type FinalTaxObject = 'umkm_individual' | 'umkm_entity' | 'land_building_rent' | 'land_building_transfer';

export function calculateFinalTax(amount: number, object: FinalTaxObject): WithholdingTaxResult {
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

  return {
    base: taxableBase,
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

export function calculatePpnBm(dpp: number, rateBand: PpnBmRateBand): WithholdingTaxResult {
  const base = Math.max(0, dpp);
  const rate = Number(rateBand) / 100;

  return {
    base,
    rate,
    tax: Math.round(base * rate),
  };
}

export interface BphtbResult {
  npop: number;
  npoptkp: number;
  taxableBase: number;
  rate: number;
  tax: number;
}

export function calculateBphtb(transactionValue: number, njop: number, npoptkp = 80000000, rate = 0.05): BphtbResult {
  const npop = Math.max(Math.max(0, transactionValue), Math.max(0, njop));
  const safeNpoptkp = Math.max(0, npoptkp);
  const safeRate = Math.min(Math.max(rate, 0), 1);
  const taxableBase = Math.max(0, npop - safeNpoptkp);

  return {
    npop,
    npoptkp: safeNpoptkp,
    taxableBase,
    rate: safeRate,
    tax: Math.round(taxableBase * safeRate),
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

export function calculatePphUnification(amount: number, object: PphUnificationObject, withoutNpwp = false): WithholdingTaxResult {
  const base = Math.max(0, amount);
  let rate = 0.02;
  const taxableBase = base;
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

  return {
    base: taxableBase,
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
