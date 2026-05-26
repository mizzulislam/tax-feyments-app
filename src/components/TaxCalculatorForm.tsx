'use client';

import { useEffect, useState } from 'react';
import {
  PTKP_VALUES,
  calculateAnnualPph21,
  calculateBphtb,
  calculateCorporateIncomeTax,
  calculateFinalTax,
  calculateLocalTax,
  calculateMonthlyTerTax,
  calculatePbbP2,
  calculatePph23,
  calculatePph26,
  calculatePphUnification,
  calculatePpnBm,
  calculateStampDuty,
  calculateTaxPenalty,
  calculateVat,
  getMonthlyTerRate,
  getTerCategory,
  type LocalTaxObject,
  type TaxPenaltyObject,
  type Pph26Object,
  type PphUnificationObject,
  type PpnBmRateBand,
  type FinalTaxObject,
  type Pph23Object,
  type PtkpStatus,
  type VatMode,
  type CorporateTaxMode,
} from '@/lib/taxEngine';
import { useMutateReport } from '@/hooks/useMutateReport';
import Tooltip from './Tooltip';

type TaxPeriod = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12';
export type CalculatorType = 'pph21' | 'ppn' | 'ppnbm' | 'pph23' | 'pphUnifikasi' | 'pphFinal' | 'pph26' | 'pphBadan' | 'bphtb' | 'pbbP2' | 'pajakDaerah' | 'sanksiPajak' | 'beaMeterai';

export const calculatorOptions: Array<{
  id: CalculatorType;
  title: string;
  subtitle: string;
  tone: string;
}> = [
  { id: 'pph21', title: 'PPh 21', subtitle: 'Karyawan dan OP', tone: 'from-cyan-400 to-blue-500' },
  { id: 'ppn', title: 'PPN', subtitle: 'BKP/JKP 2025', tone: 'from-blue-400 to-indigo-500' },
  { id: 'ppnbm', title: 'PPnBM', subtitle: 'Barang mewah', tone: 'from-rose-400 to-blue-400' },
  { id: 'pph23', title: 'PPh 23', subtitle: 'Jasa, sewa, royalti', tone: 'from-sky-400 to-emerald-400' },
  { id: 'pphUnifikasi', title: 'PPh Unifikasi', subtitle: '4(2), 15, 22, 23, 26', tone: 'from-cyan-400 to-violet-400' },
  { id: 'pphFinal', title: 'PPh Final', subtitle: 'UMKM dan properti', tone: 'from-amber-400 to-blue-400' },
  { id: 'pph26', title: 'PPh 26', subtitle: 'Subjek luar negeri', tone: 'from-indigo-300 to-emerald-400' },
  { id: 'pphBadan', title: 'PPh Badan', subtitle: 'Laba kena pajak', tone: 'from-violet-500 to-sky-400' },
  { id: 'bphtb', title: 'BPHTB', subtitle: 'Perolehan tanah/bangunan', tone: 'from-emerald-400 to-blue-400' },
  { id: 'pbbP2', title: 'PBB-P2', subtitle: 'Bumi bangunan daerah', tone: 'from-teal-300 to-blue-400' },
  { id: 'pajakDaerah', title: 'Pajak Daerah', subtitle: 'PKB, PBJT, reklame', tone: 'from-lime-300 to-cyan-400' },
  { id: 'sanksiPajak', title: 'Sanksi Pajak', subtitle: 'Denda & bunga KUP', tone: 'from-red-300 to-amber-300' },
  { id: 'beaMeterai', title: 'Bea Meterai', subtitle: 'Dokumen transaksi', tone: 'from-slate-300 to-blue-400' },
];

const formatRupiah = (value: number) => `Rp ${Math.round(value).toLocaleString('id-ID')}`;
const formatNumberInput = (value: number) => value > 0 ? Math.round(value).toLocaleString('id-ID') : '';
const parseFormattedNumber = (value: string) => {
  const normalized = value.replace(/[^\d]/g, '');
  return normalized ? Number(normalized) : 0;
};
const parseDecimalNumber = (value: string) => {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  const firstDotIndex = normalized.indexOf('.');
  const decimal = firstDotIndex === -1
    ? normalized
    : `${normalized.slice(0, firstDotIndex + 1)}${normalized.slice(firstDotIndex + 1).replace(/\./g, '')}`;
  const parsed = Number(decimal);
  return Number.isFinite(parsed) ? parsed : 0;
};
const currentYear = new Date().getFullYear();

const taxPeriodOptions: SelectOption[] = [
  { value: '01', label: '01 - Januari' },
  { value: '02', label: '02 - Februari' },
  { value: '03', label: '03 - Maret' },
  { value: '04', label: '04 - April' },
  { value: '05', label: '05 - Mei' },
  { value: '06', label: '06 - Juni' },
  { value: '07', label: '07 - Juli' },
  { value: '08', label: '08 - Agustus' },
  { value: '09', label: '09 - September' },
  { value: '10', label: '10 - Oktober' },
  { value: '11', label: '11 - November' },
  { value: '12', label: '12 - Desember / Tahunan' },
];

const ptkpOptions: SelectOption[] = [
  { value: 'TK/0', label: 'TK/0 - Tidak Kawin (Rp 54.000.000)' },
  { value: 'TK/1', label: 'TK/1 - Tidak Kawin, 1 Tanggungan (Rp 58.500.000)' },
  { value: 'TK/2', label: 'TK/2 - Tidak Kawin, 2 Tanggungan (Rp 63.000.000)' },
  { value: 'TK/3', label: 'TK/3 - Tidak Kawin, 3 Tanggungan (Rp 67.500.000)' },
  { value: 'K/0', label: 'K/0 - Kawin, Tanpa Tanggungan (Rp 58.500.000)' },
  { value: 'K/1', label: 'K/1 - Kawin, 1 Tanggungan (Rp 63.000.000)' },
  { value: 'K/2', label: 'K/2 - Kawin, 2 Tanggungan (Rp 67.500.000)' },
  { value: 'K/3', label: 'K/3 - Kawin, 3 Tanggungan (Rp 72.000.000)' },
];

const vatModeOptions: SelectOption[] = [
  { value: 'non_luxury_2025', label: 'BKP/JKP Non-Mewah 2025 - Efektif 11%' },
  { value: 'standard', label: 'DPP Normal - Tarif 12%' },
];

const ppnbmRateOptions: SelectOption[] = [
  { value: '10', label: 'Kelompok 10%' },
  { value: '20', label: 'Kelompok 20%' },
  { value: '40', label: 'Kelompok 40%' },
  { value: '50', label: 'Kelompok 50%' },
  { value: '75', label: 'Kelompok 75%' },
];

const pph23Options: SelectOption[] = [
  { value: 'service_rent', label: 'Sewa / Jasa - 2%' },
  { value: 'royalty_dividend_interest', label: 'Dividen / Bunga / Royalti / Hadiah - 15%' },
];

const pphUnificationOptions: SelectOption[] = [
  { value: 'pph22_government_goods', label: 'PPh 22 Bendahara Pemerintah - 1,5%' },
  { value: 'pph22_import_api', label: 'PPh 22 Impor API - 2,5%' },
  { value: 'pph22_import_non_api', label: 'PPh 22 Impor Non-API - 7,5%' },
  { value: 'pph22_luxury_goods', label: 'PPh 22 Barang Sangat Mewah - 5%' },
  { value: 'pph23_service_rent', label: 'PPh 23 Sewa/Jasa - 2%' },
  { value: 'pph23_royalty_dividend_interest', label: 'PPh 23 Dividen/Bunga/Royalti - 15%' },
  { value: 'pph4_land_building_transfer', label: 'PPh 4(2) Pengalihan Tanah/Bangunan - 2,5%' },
  { value: 'pph4_land_building_rent', label: 'PPh 4(2) Sewa Tanah/Bangunan - 10%' },
  { value: 'pph15_domestic_shipping', label: 'PPh 15 Pelayaran Dalam Negeri - 1,2%' },
  { value: 'pph26_gross_income', label: 'PPh 26 Penghasilan Bruto - 20%' },
];

const finalTaxOptions: SelectOption[] = [
  { value: 'umkm_individual', label: 'UMKM Orang Pribadi - 0,5% setelah Rp 500 juta' },
  { value: 'umkm_entity', label: 'UMKM Badan - 0,5%' },
  { value: 'land_building_rent', label: 'Sewa Tanah/Bangunan - 10%' },
  { value: 'land_building_transfer', label: 'Pengalihan Tanah/Bangunan - 2,5%' },
];

const pph26Options: SelectOption[] = [
  { value: 'gross_income', label: 'Dividen/Bunga/Royalti/Jasa/Sewa - 20% bruto' },
  { value: 'asset_transfer', label: 'Pengalihan harta tertentu - efektif 5%' },
  { value: 'insurance_premium', label: 'Premi asuransi luar negeri - basis neto 50%' },
];

const corporateTaxModeOptions: SelectOption[] = [
  { value: 'general', label: 'WP Badan umum - 22%' },
  { value: 'public_company', label: 'Perseroan terbuka memenuhi syarat - 19%' },
  { value: 'umkm_final', label: 'Badan UMKM final - 0,5% omzet' },
];

const localTaxOptions: SelectOption[] = [
  { value: 'pkb_first', label: 'PKB pertama - maks 1,2%' },
  { value: 'pkb_progressive_max', label: 'PKB progresif - maks 6%' },
  { value: 'bbnkb', label: 'BBNKB - maks 12%' },
  { value: 'pbjt_general', label: 'PBJT umum - maks 10%' },
  { value: 'pbjt_specific_entertainment', label: 'PBJT hiburan tertentu - 40%' },
  { value: 'reklame', label: 'Pajak reklame - maks 25%' },
  { value: 'air_tanah', label: 'Pajak air tanah - maks 20%' },
  { value: 'pbbkb', label: 'PBBKB - maks 10%' },
  { value: 'rokok', label: 'Pajak rokok - 10%' },
  { value: 'mblb', label: 'Pajak MBLB - maks 20%' },
  { value: 'sarang_burung_walet', label: 'Pajak sarang burung walet - maks 10%' },
];

const taxPenaltyOptions: SelectOption[] = [
  { value: 'late_spt_annual_individual', label: 'Terlambat SPT Tahunan OP - Rp100.000' },
  { value: 'late_spt_annual_corporate', label: 'Terlambat SPT Tahunan Badan - Rp1.000.000' },
  { value: 'late_spt_vat_period', label: 'Terlambat SPT Masa PPN - Rp500.000' },
  { value: 'late_spt_other_period', label: 'Terlambat SPT Masa lainnya - Rp100.000' },
  { value: 'interest_collection', label: 'Bunga penagihan/angsuran Pasal 19 - 0,55%/bulan' },
  { value: 'interest_correction_late_payment', label: 'Pembetulan/terlambat setor - 0,97%/bulan' },
  { value: 'interest_disclosure', label: 'Pengungkapan ketidakbenaran - 1,39%/bulan' },
  { value: 'interest_skpkb', label: 'SKPKB Pasal 13(2) - 1,80%/bulan' },
  { value: 'interest_skpkb_additional', label: 'Tambahan SKPKB Pasal 13(3b) - 2,22%/bulan' },
];

const taxYearOptions: SelectOption[] = Array.from({ length: 9 }, (_, index) => {
  const year = currentYear + 3 - index;
  return { value: String(year), label: String(year) };
});

type SelectOption = {
  label: string;
  value: string;
};

function ModernSelect({
  id,
  value,
  placeholder = 'Pilih',
  options,
  open,
  onToggle,
  onChange,
}: {
  id: string;
  value?: string | null;
  placeholder?: string;
  options: SelectOption[];
  open: boolean;
  onToggle: (id: string | null) => void;
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onToggle(open ? null : id)}
        className="group flex w-full items-center justify-between gap-3 rounded-md border border-slate-700/55 bg-slate-950/40 px-3.5 py-2.5 text-left text-sm text-white outline-none transition hover:border-blue-500/50 hover:bg-slate-950/70 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/25"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${selected ? 'text-white' : 'text-slate-500'}`}>{selected?.label || placeholder}</span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-slate-300 transition-transform duration-200 ${open ? 'rotate-180 text-blue-300' : 'group-hover:text-blue-300'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-blue-500/25 bg-slate-950/95 p-1.5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
          <div className="max-h-64 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(59,130,246,0.45)_rgba(15,23,42,0.8)]" role="listbox">
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    onToggle(null);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {active && (
                    <svg className="h-4 w-4 flex-shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function YearCombobox({
  id,
  value,
  options,
  open,
  onToggle,
  onChange,
}: {
  id: string;
  value: number;
  options: SelectOption[];
  open: boolean;
  onToggle: (id: string | null) => void;
  onChange: (value: number) => void;
}) {
  return (
    <div className="relative">
      <div className="group flex w-full items-center justify-between gap-3 rounded-md border border-slate-700/55 bg-slate-950/40 px-3.5 py-2.5 text-left text-sm text-white outline-none transition hover:border-blue-500/50 hover:bg-slate-950/70 focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/25">
        <input
          type="text"
          inputMode="numeric"
          value={String(value)}
          onFocus={() => onToggle(id)}
          onChange={(event) => {
            const parsed = parseFormattedNumber(event.target.value);
            onChange(parsed || currentYear);
          }}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-white outline-none"
          aria-label="Tahun Pajak"
        />
        <button
          type="button"
          onClick={() => onToggle(open ? null : id)}
          className="flex-shrink-0 text-slate-300 transition hover:text-blue-300"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180 text-blue-300' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-blue-500/25 bg-slate-950/95 p-1.5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
          <div className="max-h-64 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(59,130,246,0.45)_rgba(15,23,42,0.8)]" role="listbox">
            {options.map((option) => {
              const active = option.value === String(value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(Number(option.value));
                    onToggle(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <span>{option.label}</span>
                  {active && (
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface TaxCalculatorFormProps {
  calculatorType: CalculatorType;
}

export default function TaxCalculatorForm({ calculatorType }: TaxCalculatorFormProps) {
  const { mutate, isPending, error: serverError } = useMutateReport();
  const [step, setStep] = useState(1);
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  useEffect(() => {
    setStep(1);
    setOpenSelect(null);
  }, [calculatorType]);

  // Step 1: Penghasilan Bruto
  const [taxYear, setTaxYear] = useState(2026);
  const [taxPeriod, setTaxPeriod] = useState<TaxPeriod>('12');
  const [gaji, setGaji] = useState<number>(0);
  const [tunjangan, setTunjangan] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);

  // Step 2: Pengurang & PTKP
  const [iuranPensiun, setIuranPensiun] = useState<number>(0);
  const [zakatSumbangan, setZakatSumbangan] = useState<number>(0);
  const [previousNetIncome, setPreviousNetIncome] = useState<number>(0);
  const [withheldTaxCredit, setWithheldTaxCredit] = useState<number>(0);
  const [ptkpStatus, setPtkpStatus] = useState<PtkpStatus>('TK/0');

  // Kalkulator pajak lainnya
  const [transactionAmount, setTransactionAmount] = useState<number>(0);
  const [vatMode, setVatMode] = useState<VatMode>('non_luxury_2025');
  const [ppnbmRateBand, setPpnbmRateBand] = useState<PpnBmRateBand>('10');
  const [pph23Object, setPph23Object] = useState<Pph23Object>('service_rent');
  const [withoutNpwp, setWithoutNpwp] = useState(false);
  const [pphUnificationObject, setPphUnificationObject] = useState<PphUnificationObject>('pph23_service_rent');
  const [pph26Object, setPph26Object] = useState<Pph26Object>('gross_income');
  const [treatyRatePercent, setTreatyRatePercent] = useState<number>(20);
  const [finalTaxObject, setFinalTaxObject] = useState<FinalTaxObject>('umkm_individual');
  const [corporateTaxMode, setCorporateTaxMode] = useState<CorporateTaxMode>('general');
  const [corporateTaxableIncome, setCorporateTaxableIncome] = useState<number>(0);
  const [corporateGrossTurnover, setCorporateGrossTurnover] = useState<number>(0);
  const [useCorporateFacility, setUseCorporateFacility] = useState(true);
  const [propertyNjop, setPropertyNjop] = useState<number>(0);
  const [bphtbNpoptkp, setBphtbNpoptkp] = useState<number>(80000000);
  const [pbbNjoptkp, setPbbNjoptkp] = useState<number>(10000000);
  const [localTaxObject, setLocalTaxObject] = useState<LocalTaxObject>('pbjt_general');
  const [localTaxRatePercent, setLocalTaxRatePercent] = useState<number>(10);
  const [taxPenaltyObject, setTaxPenaltyObject] = useState<TaxPenaltyObject>('late_spt_annual_individual');
  const [penaltyMonths, setPenaltyMonths] = useState<number>(1);

  // Helper penanganan input angka yang aman dari NaN dan negatif
  const handleNumberInput = (value: string, setter: (val: number) => void) => {
    setter(Math.max(0, parseFormattedNumber(value)));
  };
  const handleDecimalInput = (value: string, setter: (val: number) => void) => {
    setter(Math.max(0, parseDecimalNumber(value)));
  };

  // Perhitungan Otomatis
  const grossIncome = gaji + tunjangan + bonus;
  const isAnnual = taxPeriod === '12';

  // Perhitungan Pajak Terutang berdasarkan jenis periode
  let estimatedTax = 0;
  let biayaJabatan = 0;
  let totalPengurang = 0;
  
  const ptkpValue = PTKP_VALUES[ptkpStatus];
  let pkp = 0;
  const annualPph21Result = calculateAnnualPph21({
    grossIncome,
    ptkpStatus,
    pensionContribution: iuranPensiun,
    religiousContribution: zakatSumbangan,
    previousNetIncome,
    withheldTaxCredit,
  });

  if (isAnnual) {
    biayaJabatan = annualPph21Result.jobExpense;
    totalPengurang = annualPph21Result.totalDeduction;
    pkp = annualPph21Result.taxableIncome;
    estimatedTax = annualPph21Result.annualTax;
  } else {
    // Bulanan dengan skema TER PPh 21 PP 58/2023
    estimatedTax = calculateMonthlyTerTax(grossIncome, ptkpStatus);
  }

  const terCategory = getTerCategory(ptkpStatus);
  const terRate = getMonthlyTerRate(grossIncome, ptkpStatus);
  const vatResult = calculateVat(transactionAmount, vatMode);
  const ppnbmResult = calculatePpnBm(transactionAmount, ppnbmRateBand);
  const pph23Result = calculatePph23(transactionAmount, pph23Object, withoutNpwp);
  const pphUnificationResult = calculatePphUnification(transactionAmount, pphUnificationObject, withoutNpwp);
  const pph26Result = calculatePph26(transactionAmount, pph26Object, treatyRatePercent / 100);
  const finalTaxResult = calculateFinalTax(transactionAmount, finalTaxObject);
  const corporateTaxResult = calculateCorporateIncomeTax(corporateTaxableIncome, corporateGrossTurnover, useCorporateFacility, corporateTaxMode);
  const bphtbResult = calculateBphtb(transactionAmount, propertyNjop, bphtbNpoptkp);
  const pbbP2Result = calculatePbbP2(transactionAmount, pbbNjoptkp);
  const localTaxResult = calculateLocalTax(transactionAmount, localTaxObject, localTaxRatePercent / 100);
  const taxPenaltyResult = calculateTaxPenalty(transactionAmount, taxPenaltyObject, penaltyMonths);
  const stampDuty = calculateStampDuty(transactionAmount);
  const pph21DisplayTax = isAnnual ? annualPph21Result.taxDue : estimatedTax;
  const selectedCalculatorOption = calculatorOptions.find((option) => option.id === calculatorType);
  const stepTracker = (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1.5">
      <span className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-slate-700'}`}></span>
      <span className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-slate-700'}`}></span>
      <span className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-blue-500' : 'bg-slate-700'}`}></span>
      <span className="ml-1 text-[10px] font-bold text-slate-400">Step {step}/3</span>
    </div>
  );

  // Handle Pengiriman
  const handleSave = (status: 'draft' | 'submitted') => {
    mutate({
      taxYear,
      taxPeriod: isAnnual ? '12' : taxPeriod,
      grossIncome,
      ptkpStatus,
      pensionContribution: iuranPensiun,
      status,
    }, {
      onSuccess: () => {
        alert(
          status === 'submitted' 
            ? 'Laporan Resmi Perpajakan Anda Berhasil Disubmit!' 
            : 'Draf Simulasi Berhasil Disimpan!'
        );
        // Reset Form ke Step 1
        setStep(1);
        setGaji(0);
        setTunjangan(0);
        setBonus(0);
        setIuranPensiun(0);
        setZakatSumbangan(0);
        setPreviousNetIncome(0);
        setWithheldTaxCredit(0);
        setPtkpStatus('TK/0');
      }
    });
  };

  return (
    <div className="relative w-full self-start overflow-hidden rounded-3xl p-[1px] shadow-2xl shadow-black/20">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/45 via-indigo-500/10 to-slate-800/40 opacity-70"></div>
      
      <div className="relative flex flex-col rounded-[23px] bg-slate-900/85 p-6 backdrop-blur-2xl md:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-blue-400/50 via-slate-700/30 to-transparent"></div>

        <div className="relative z-10 mb-8">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Kalkulator Pajak Terpadu</h2>
              <p className="text-xs text-slate-400 mt-1">Masukkan dasar pengenaan, lalu lihat estimasi pajak dan rincian tarifnya.</p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Workflow</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  'Pilih jenis pajak',
                  'Isi dasar pengenaan',
                  'Baca estimasi',
                ].map((item, index) => (
                  <div key={item} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/45 px-3 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/25 bg-blue-500/10 text-[9px] font-black text-blue-300">{index + 1}</span>
                    <span className="min-w-0 whitespace-nowrap text-[10px] font-bold leading-snug text-slate-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Regulasi</p>
              <p className="mt-4 text-xs font-semibold leading-relaxed text-slate-400 sm:mt-6">
                PPh 21 memakai TER PP 58/2023 dan rekonsiliasi tahunan Pasal 17. Tarif daerah mengikuti Perda, sedangkan sanksi bunga memakai KMK 19/MK/EF.2/2026 periode Mei 2026.
              </p>
            </div>
          </div>
        </div>

        {calculatorType !== 'pph21' ? (
          <div className="relative z-10 space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Kalkulator {selectedCalculatorOption?.title ?? 'Pajak'}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {selectedCalculatorOption?.subtitle ?? 'Masukkan dasar pengenaan, lalu lihat estimasi pajaknya.'}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    Dasar Pengenaan / Nilai Transaksi
                    <Tooltip content="Masukkan nilai bruto, DPP, omzet, atau nilai dokumen sesuai jenis pajak yang dipilih." />
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-xs font-semibold text-slate-500">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberInput(transactionAmount)}
                      onChange={(e) => handleNumberInput(e.target.value, setTransactionAmount)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-12 pr-4 font-mono text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                {calculatorType === 'ppn' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      Skema PPN
                      <Tooltip content="Mulai 2025 tarif PPN umum 12%. Untuk BKP/JKP non-mewah, DPP nilai lain 11/12 membuat beban efektif tetap 11%." />
                    </label>
                    <ModernSelect
                      id="vatMode"
                      value={vatMode}
                      options={vatModeOptions}
                      open={openSelect === 'vatMode'}
                      onToggle={setOpenSelect}
                      onChange={(value) => setVatMode(value as VatMode)}
                    />
                  </div>
                )}

                {calculatorType === 'ppnbm' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      Tarif PPnBM
                      <Tooltip content="PPnBM dikenakan atas BKP yang tergolong mewah. Pilih lapisan tarif umum sesuai kelompok barang: 10%, 20%, 40%, 50%, atau 75%." />
                    </label>
                    <ModernSelect
                      id="ppnbmRateBand"
                      value={ppnbmRateBand}
                      options={ppnbmRateOptions}
                      open={openSelect === 'ppnbmRateBand'}
                      onToggle={setOpenSelect}
                      onChange={(value) => setPpnbmRateBand(value as PpnBmRateBand)}
                    />
                  </div>
                )}

                {calculatorType === 'pph23' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Objek PPh 23
                        <Tooltip content="Tarif umum PPh 23 antara lain 15% untuk dividen/bunga/royalti/hadiah dan 2% untuk sewa atau jasa tertentu." />
                      </label>
                      <ModernSelect
                        id="pph23Object"
                        value={pph23Object}
                        options={pph23Options}
                        open={openSelect === 'pph23Object'}
                        onToggle={setOpenSelect}
                        onChange={(value) => setPph23Object(value as Pph23Object)}
                      />
                    </div>
                    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3 text-sm font-semibold text-slate-300">
                      Penerima tanpa NPWP
                      <input
                        type="checkbox"
                        checked={withoutNpwp}
                        onChange={(e) => setWithoutNpwp(e.target.checked)}
                        className="h-4 w-4 accent-blue-500"
                      />
                    </label>
                  </>
                )}

                {calculatorType === 'pphUnifikasi' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Objek PPh Unifikasi
                        <Tooltip content="SPT Masa PPh Unifikasi menampung bukti potong/pungut untuk PPh Pasal 4(2), 15, 22, 23, dan 26." />
                      </label>
                      <ModernSelect
                        id="pphUnificationObject"
                        value={pphUnificationObject}
                        options={pphUnificationOptions}
                        open={openSelect === 'pphUnificationObject'}
                        onToggle={setOpenSelect}
                        onChange={(value) => setPphUnificationObject(value as PphUnificationObject)}
                      />
                    </div>
                    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3 text-sm font-semibold text-slate-300">
                      Penerima tanpa NPWP
                      <input
                        type="checkbox"
                        checked={withoutNpwp}
                        onChange={(e) => setWithoutNpwp(e.target.checked)}
                        className="h-4 w-4 accent-blue-500"
                      />
                    </label>
                  </>
                )}

                {calculatorType === 'pphFinal' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      Objek PPh Final
                      <Tooltip content="Simulasi mencakup UMKM 0,5%, sewa tanah/bangunan 10%, dan pengalihan tanah/bangunan 2,5%." />
                    </label>
                    <ModernSelect
                      id="finalTaxObject"
                      value={finalTaxObject}
                      options={finalTaxOptions}
                      open={openSelect === 'finalTaxObject'}
                      onToggle={setOpenSelect}
                      onChange={(value) => setFinalTaxObject(value as FinalTaxObject)}
                    />
                  </div>
                )}

                {calculatorType === 'pph26' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Objek PPh 26
                        <Tooltip content="Tarif domestik umum PPh 26 adalah 20%, dapat menjadi lebih rendah jika memenuhi ketentuan tax treaty/P3B." />
                      </label>
                      <ModernSelect
                        id="pph26Object"
                        value={pph26Object}
                        options={pph26Options}
                        open={openSelect === 'pph26Object'}
                        onToggle={setOpenSelect}
                        onChange={(value) => setPph26Object(value as Pph26Object)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Tarif P3B / Treaty
                        <Tooltip content="Isi 20 jika tidak menggunakan tax treaty. Jika lawan transaksi punya SKD valid, masukkan tarif P3B yang berlaku." />
                      </label>
                      <input
                        type="number"
                        value={treatyRatePercent}
                        step="0.01"
                        min="0"
                        max="100"
                        onChange={(e) => handleDecimalInput(e.target.value, setTreatyRatePercent)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 font-mono text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </>
                )}

                {calculatorType === 'pphBadan' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Skema PPh Badan
                        <Tooltip content="Pilih tarif badan umum 22%, perseroan terbuka yang memenuhi syarat 19%, atau PPh Final UMKM 0,5% dari omzet." />
                      </label>
                      <ModernSelect
                        id="corporateTaxMode"
                        value={corporateTaxMode}
                        options={corporateTaxModeOptions}
                        open={openSelect === 'corporateTaxMode'}
                        onToggle={setOpenSelect}
                        onChange={(value) => setCorporateTaxMode(value as CorporateTaxMode)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Penghasilan Kena Pajak Badan
                        <Tooltip content={corporateTaxMode === 'umkm_final' ? "Opsional untuk skema UMKM final karena pajak dihitung dari omzet bruto." : "Masukkan laba fiskal atau PKP badan setelah koreksi fiskal dan kompensasi rugi."} />
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-xs font-semibold text-slate-500">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberInput(corporateTaxableIncome)}
                          onChange={(e) => handleNumberInput(e.target.value, setCorporateTaxableIncome)}
                          placeholder="0"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-12 pr-4 font-mono text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Peredaran Bruto Setahun
                        <Tooltip content="Dipakai untuk simulasi fasilitas Pasal 31E bagi peredaran bruto sampai Rp 50 miliar." />
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-xs font-semibold text-slate-500">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberInput(corporateGrossTurnover)}
                          onChange={(e) => handleNumberInput(e.target.value, setCorporateGrossTurnover)}
                          placeholder="0"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-12 pr-4 font-mono text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/35 px-4 py-3 text-sm font-semibold text-slate-300">
                      Gunakan fasilitas Pasal 31E
                      <input
                        type="checkbox"
                        checked={useCorporateFacility}
                        onChange={(e) => setUseCorporateFacility(e.target.checked)}
                        disabled={corporateTaxMode !== 'general'}
                        className="h-4 w-4 accent-blue-500"
                      />
                    </label>
                  </>
                )}

                {calculatorType === 'bphtb' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        NJOP Pembanding
                        <Tooltip content="BPHTB memakai NPOP, umumnya nilai yang lebih tinggi antara harga transaksi dan NJOP." />
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-xs font-semibold text-slate-500">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberInput(propertyNjop)}
                          onChange={(e) => handleNumberInput(e.target.value, setPropertyNjop)}
                          placeholder="0"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-12 pr-4 font-mono text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        NPOPTKP Daerah
                        <Tooltip content="Nilai tidak kena pajak BPHTB ditetapkan daerah. Default simulasi memakai Rp80 juta sebagai batas minimal umum menurut UU HKPD." />
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-xs font-semibold text-slate-500">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberInput(bphtbNpoptkp)}
                          onChange={(e) => handleNumberInput(e.target.value, setBphtbNpoptkp)}
                          placeholder="80000000"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-12 pr-4 font-mono text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                  </>
                )}

                {calculatorType === 'pbbP2' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      NJOPTKP
                      <Tooltip content="Nilai Jual Objek Pajak Tidak Kena Pajak PBB-P2 ditetapkan daerah. Default simulasi memakai Rp10 juta." />
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-xs font-semibold text-slate-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberInput(pbbNjoptkp)}
                        onChange={(e) => handleNumberInput(e.target.value, setPbbNjoptkp)}
                        placeholder="10000000"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-12 pr-4 font-mono text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                )}

                {calculatorType === 'pajakDaerah' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Jenis Pajak Daerah
                        <Tooltip content="Tarif daerah dapat berbeda per perda. Nilai default memakai batas umum UU HKPD/ketentuan daerah yang lazim, dan bisa disesuaikan." />
                      </label>
                      <ModernSelect
                        id="localTaxObject"
                        value={localTaxObject}
                        options={localTaxOptions}
                        open={openSelect === 'localTaxObject'}
                        onToggle={setOpenSelect}
                        onChange={(value) => setLocalTaxObject(value as LocalTaxObject)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Tarif Daerah (%)
                        <Tooltip content="Sesuaikan dengan Perda lokasi objek pajak. Contoh: PBJT restoran umumnya sampai 10%, reklame sampai 25%, air tanah sampai 20%." />
                      </label>
                      <input
                        type="number"
                        value={localTaxRatePercent}
                        step="0.01"
                        min="0"
                        max="100"
                        onChange={(e) => handleDecimalInput(e.target.value, setLocalTaxRatePercent)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 font-mono text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </>
                )}

                {calculatorType === 'sanksiPajak' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Jenis Sanksi
                        <Tooltip content="Denda tetap mengikuti Pasal 7 KUP. Bunga memakai tarif KMK 19/MK/EF.2/2026 untuk periode 1-31 Mei 2026." />
                      </label>
                      <ModernSelect
                        id="taxPenaltyObject"
                        value={taxPenaltyObject}
                        options={taxPenaltyOptions}
                        open={openSelect === 'taxPenaltyObject'}
                        onToggle={setOpenSelect}
                        onChange={(value) => setTaxPenaltyObject(value as TaxPenaltyObject)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Jumlah Bulan
                        <Tooltip content="Untuk sanksi bunga, jumlah bulan dibulatkan ke atas dan dibatasi maksimal 24 bulan. Untuk denda tetap, isian ini diabaikan." />
                      </label>
                      <input
                        type="number"
                        value={penaltyMonths}
                        onChange={(e) => handleNumberInput(e.target.value, setPenaltyMonths)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 font-mono text-sm text-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Estimasi Pajak Terutang</span>
                <p className="mt-2 font-mono text-3xl font-black text-white">
                  {calculatorType === 'ppn' && formatRupiah(vatResult.tax)}
                  {calculatorType === 'ppnbm' && formatRupiah(ppnbmResult.tax)}
                  {calculatorType === 'pph23' && formatRupiah(pph23Result.tax)}
                  {calculatorType === 'pphUnifikasi' && formatRupiah(pphUnificationResult.tax)}
                  {calculatorType === 'pphFinal' && formatRupiah(finalTaxResult.tax)}
                  {calculatorType === 'pph26' && formatRupiah(pph26Result.tax)}
                  {calculatorType === 'pphBadan' && formatRupiah(corporateTaxResult.tax)}
                  {calculatorType === 'bphtb' && formatRupiah(bphtbResult.tax)}
                  {calculatorType === 'pbbP2' && formatRupiah(pbbP2Result.tax)}
                  {calculatorType === 'pajakDaerah' && formatRupiah(localTaxResult.tax)}
                  {calculatorType === 'sanksiPajak' && formatRupiah(taxPenaltyResult.penalty)}
                  {calculatorType === 'beaMeterai' && formatRupiah(stampDuty)}
                </p>

                <div className="mt-5 space-y-2.5 text-xs font-medium">
                  {calculatorType === 'ppn' && (
                    <>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">DPP:</span><span className="font-mono text-slate-200">{formatRupiah(vatResult.dpp)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif:</span><span className="font-mono text-slate-200">{(vatResult.rate * 100).toFixed(0)}%</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif efektif:</span><span className="font-mono text-slate-200">{(vatResult.effectiveRate * 100).toFixed(2)}%</span></div>
                    </>
                  )}
                  {calculatorType === 'ppnbm' && (
                    <>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">DPP PPnBM:</span><span className="font-mono text-slate-200">{formatRupiah(ppnbmResult.base)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif:</span><span className="font-mono text-slate-200">{(ppnbmResult.rate * 100).toFixed(0)}%</span></div>
                    </>
                  )}
                  {calculatorType === 'pph23' && (
                    <>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Dasar pemotongan:</span><span className="font-mono text-slate-200">{formatRupiah(pph23Result.base)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif:</span><span className="font-mono text-slate-200">{(pph23Result.rate * 100).toFixed(0)}%</span></div>
                    </>
                  )}
                  {calculatorType === 'pphUnifikasi' && (
                    <>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Dasar potong/pungut:</span><span className="font-mono text-slate-200">{formatRupiah(pphUnificationResult.base)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif:</span><span className="font-mono text-slate-200">{(pphUnificationResult.rate * 100).toFixed(2)}%</span></div>
                    </>
                  )}
                  {calculatorType === 'pphFinal' && (
                    <>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Bagian kena pajak:</span><span className="font-mono text-slate-200">{formatRupiah(finalTaxResult.base)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif:</span><span className="font-mono text-slate-200">{(finalTaxResult.rate * 100).toFixed(2)}%</span></div>
                    </>
                  )}
                  {calculatorType === 'pph26' && (
                    <>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Basis pajak:</span><span className="font-mono text-slate-200">{formatRupiah(pph26Result.base)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif efektif:</span><span className="font-mono text-slate-200">{(pph26Result.rate * 100).toFixed(2)}%</span></div>
                    </>
                  )}
                  {calculatorType === 'pphBadan' && (
                    corporateTaxMode === 'umkm_final' ? (
                      <>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Omzet kena final:</span><span className="font-mono text-slate-200">{formatRupiah(corporateTaxResult.grossTurnover)}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif final:</span><span className="font-mono text-slate-200">{(corporateTaxResult.rate * 100).toFixed(2)}%</span></div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">PKP fasilitas:</span><span className="font-mono text-slate-200">{formatRupiah(corporateTaxResult.facilityIncome)}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">PKP tarif normal:</span><span className="font-mono text-slate-200">{formatRupiah(corporateTaxResult.normalIncome)}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif umum:</span><span className="font-mono text-slate-200">{(corporateTaxResult.rate * 100).toFixed(0)}%</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif efektif:</span><span className="font-mono text-slate-200">{(corporateTaxResult.effectiveRate * 100).toFixed(2)}%</span></div>
                      </>
                    )
                  )}
                  {calculatorType === 'bphtb' && (
                    <>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">NPOP:</span><span className="font-mono text-slate-200">{formatRupiah(bphtbResult.npop)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">NPOPTKP:</span><span className="font-mono text-slate-200">{formatRupiah(bphtbResult.npoptkp)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">NPOP kena pajak:</span><span className="font-mono text-slate-200">{formatRupiah(bphtbResult.taxableBase)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif:</span><span className="font-mono text-slate-200">{(bphtbResult.rate * 100).toFixed(0)}%</span></div>
                    </>
                  )}
                  {calculatorType === 'pbbP2' && (
                    <>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">NJOP:</span><span className="font-mono text-slate-200">{formatRupiah(pbbP2Result.njop)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">NJOPTKP:</span><span className="font-mono text-slate-200">{formatRupiah(pbbP2Result.njoptkp)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">NJOP kena pajak:</span><span className="font-mono text-slate-200">{formatRupiah(pbbP2Result.taxableBase)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif:</span><span className="font-mono text-slate-200">{(pbbP2Result.rate * 100).toFixed(2)}%</span></div>
                    </>
                  )}
                  {calculatorType === 'pajakDaerah' && (
                    <>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Dasar pajak:</span><span className="font-mono text-slate-200">{formatRupiah(localTaxResult.base)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif:</span><span className="font-mono text-slate-200">{(localTaxResult.rate * 100).toFixed(2)}%</span></div>
                    </>
                  )}
                  {calculatorType === 'sanksiPajak' && (
                    <>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Pokok kurang bayar:</span><span className="font-mono text-slate-200">{formatRupiah(taxPenaltyResult.base)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Denda tetap:</span><span className="font-mono text-slate-200">{formatRupiah(taxPenaltyResult.fixedFine)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Bulan bunga:</span><span className="font-mono text-slate-200">{taxPenaltyResult.months}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif bunga:</span><span className="font-mono text-slate-200">{(taxPenaltyResult.rate * 100).toFixed(2)}%</span></div>
                    </>
                  )}
                  {calculatorType === 'beaMeterai' && (
                    <>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Ambang dokumen:</span><span className="font-mono text-slate-200">Rp 5.000.000</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Tarif meterai:</span><span className="font-mono text-slate-200">Rp 10.000</span></div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-medium leading-relaxed text-amber-200">
              Hasil ini adalah simulasi awal. Untuk implementasi produksi semua jenis pajak, tiap objek pajak perlu modul aturan, pengecualian, bukti potong/pungut, kode akun pajak, dan validasi masa pajaknya sendiri.
            </div>
          </div>
        ) : (
        <div className="relative z-10">
          {/* Header & Step Tracker */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Kalkulator PPh 21</h2>
              <p className="text-xs text-slate-400 mt-1">Isi penghasilan, pengurang, lalu lihat estimasi PPh 21.</p>
            </div>
            <div className="hidden sm:block">
              {stepTracker}
            </div>
          </div>

          {/* STEP 1: PENGHASILAN BRUTO */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    Tahun Pajak
                    <Tooltip content="Tahun buku kalender perpajakan yang dilaporkan (contoh: 2026)." />
                  </label>
                  <YearCombobox
                    id="taxYear"
                    value={taxYear}
                    options={taxYearOptions}
                    open={openSelect === 'taxYear'}
                    onToggle={setOpenSelect}
                    onChange={setTaxYear}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    Masa Pajak
                    <Tooltip content="Periode pajak yang dihitung. Masa Januari-November memakai TER bulanan, sedangkan Desember dihitung sebagai rekonsiliasi setahun." />
                  </label>
                  <ModernSelect
                    id="taxPeriod"
                    value={taxPeriod}
                    options={taxPeriodOptions}
                    open={openSelect === 'taxPeriod'}
                    onToggle={setOpenSelect}
                    onChange={(value) => setTaxPeriod(value as TaxPeriod)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  {isAnnual ? 'Gaji Pokok Setahun' : 'Gaji Pokok Bulanan'}
                  <Tooltip content={isAnnual ? "Total penghasilan rutin kotor (gross) setahun sebelum dikurangi potongan apapun seperti asuransi dan iuran." : "Total penghasilan rutin kotor (gross) dalam sebulan sebelum dikurangi potongan apapun seperti asuransi dan iuran."} />
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberInput(gaji)}
                    onChange={(e) => handleNumberInput(e.target.value, setGaji)}
                    placeholder="0"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  {isAnnual ? 'Tunjangan Setahun' : 'Tunjangan Bulanan'}
                  <Tooltip content={isAnnual ? "Total seluruh tunjangan teratur/tidak teratur (kesehatan, makan, transportasi, keluarga) yang diterima dalam setahun." : "Total seluruh tunjangan teratur/tidak teratur (kesehatan, makan, transportasi, keluarga) yang diterima dalam sebulan."} />
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberInput(tunjangan)}
                    onChange={(e) => handleNumberInput(e.target.value, setTunjangan)}
                    placeholder="0"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  {isAnnual ? 'Bonus / THR / Lainnya' : 'Bonus / Lainnya Bulanan'}
                  <Tooltip content={isAnnual ? "Pendapatan bruto sekali setahun yang tidak rutin, seperti Tunjangan Hari Raya (THR), bonus kinerja, atau jasa produksi." : "Pendapatan bruto bulanan yang tidak rutin (jika ada) yang diterima dalam bulan bersangkutan."} />
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberInput(bonus)}
                    onChange={(e) => handleNumberInput(e.target.value, setBonus)}
                    placeholder="0"
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs">
                <div>
                  <p className="text-slate-500">{isAnnual ? 'Total Bruto Setahun:' : 'Total Bruto Bulanan:'}</p>
                  <p className="text-sm font-bold text-white mt-0.5 font-mono">Rp {grossIncome.toLocaleString('id-ID')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md text-xs uppercase tracking-wider"
                >
                  Lanjut Step 2
                </button>
              </div>
              <div className="flex justify-center sm:hidden">
                {stepTracker}
              </div>
            </div>
          )}

          {/* STEP 2: PENGURANG & PTKP */}
          {step === 2 && (
            <div className="space-y-5">
              {!isAnnual && (
                <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 rounded-xl leading-relaxed">
                  Perhitungan PPh 21 Bulanan menggunakan skema <strong>Tarif Efektif Rata-rata (TER) PP 58/2023</strong>. Tarif ini langsung dikalikan dengan Penghasilan Bruto Bulanan tanpa dikurangi Biaya Jabatan atau Iuran Pensiun.
                </div>
              )}

              {isAnnual && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      Iuran Pensiun / JHT Setahun
                      <Tooltip content="Iuran pensiun/THT/JHT yang dibayar pegawai dan dapat menjadi pengurang penghasilan bruto dalam penghitungan PPh 21 tahunan." />
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberInput(iuranPensiun)}
                        onChange={(e) => handleNumberInput(e.target.value, setIuranPensiun)}
                        placeholder="0"
                        className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      Zakat / Sumbangan Wajib
                      <Tooltip content="Zakat atau sumbangan keagamaan wajib yang dibayarkan melalui lembaga resmi dan memenuhi syarat sebagai pengurang." />
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberInput(zakatSumbangan)}
                        onChange={(e) => handleNumberInput(e.target.value, setZakatSumbangan)}
                        placeholder="0"
                        className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      Neto Sebelumnya
                      <Tooltip content="Isi jika pegawai pindah kerja atau ada penghasilan neto dari masa/pemberi kerja sebelumnya yang harus digabung setahun." />
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberInput(previousNetIncome)}
                        onChange={(e) => handleNumberInput(e.target.value, setPreviousNetIncome)}
                        placeholder="0"
                        className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      Kredit PPh 21 Dipotong
                      <Tooltip content="Jumlah PPh 21 yang sudah dipotong pada masa sebelumnya atau oleh pemberi kerja lain, untuk menghitung kurang/lebih bayar akhir tahun." />
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberInput(withheldTaxCredit)}
                        onChange={(e) => handleNumberInput(e.target.value, setWithheldTaxCredit)}
                        placeholder="0"
                        className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  Status PTKP (UU HPP)
                  <Tooltip content="Batas Penghasilan Tidak Kena Pajak. Semakin banyak tanggungan anak (max 3), semakin besar pengurang PTKP Anda." />
                </label>
                <ModernSelect
                  id="ptkpStatus"
                  value={ptkpStatus}
                  options={ptkpOptions}
                  open={openSelect === 'ptkpStatus'}
                  onToggle={setOpenSelect}
                  onChange={(value) => setPtkpStatus(value as PtkpStatus)}
                />
              </div>

              {/* Box Preview Pengurang / Info TER */}
              {isAnnual ? (
                <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl text-xs space-y-2 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center">
                      Biaya Jabatan (Otomatis 5%):
                      <Tooltip content="Fasilitas pengurang otomatis dari negara sebesar 5% dari pendapatan bruto setahun, dengan batas maksimal Rp 6.000.000." />
                    </span>
                    <span className="font-semibold text-slate-300 font-mono">Rp {biayaJabatan.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/50 pt-2 font-bold">
                    <span className="text-slate-400">Total Pengurang:</span>
                    <span className="text-white font-mono">Rp {totalPengurang.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/50 pt-2">
                    <span className="text-slate-500">Kredit PPh 21:</span>
                    <span className="font-semibold text-slate-300 font-mono">Rp {annualPph21Result.withheldTaxCredit.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl text-xs space-y-2 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center">
                      Kategori TER Bulanan:
                      <Tooltip content="Kategori TER ditentukan berdasarkan status PTKP Anda di awal tahun: Kategori A (TK/0, TK/1, K/0), Kategori B (TK/2, TK/3, K/1, K/2), Kategori C (K/3)." />
                    </span>
                    <span className="font-semibold text-blue-400">Kategori {terCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center">
                      Tarif TER Efektif:
                      <Tooltip content="Persentase tarif efektif bulanan berdasarkan kategori TER dan rentang penghasilan bruto bulanan Anda (PP 58/2023)." />
                    </span>
                    <span className="font-semibold text-indigo-400 font-mono">{(terRate * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800/50 pt-2 font-bold">
                    <span className="text-slate-400">Estimasi PPh 21 Bulan Ini:</span>
                    <span className="text-white font-mono">Rp {estimatedTax.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all text-xs shadow-md uppercase tracking-wider"
                >
                  Lanjut Step 3
                </button>
              </div>
              <div className="flex justify-center sm:hidden">
                {stepTracker}
              </div>
            </div>
          )}

          {/* STEP 3: RINGKASAN & SUBMIT */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center relative overflow-hidden">
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-600/30 text-blue-400 border border-blue-500/30">
                  {isAnnual ? 'Pasal 17 Progresif' : 'TER PPh 21'}
                </div>
                <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">
                  {isAnnual ? 'Estimasi PPh 21 Kurang Bayar' : 'Estimasi Pajak Terutang Bulanan'}
                </span>
                <p className="text-3xl font-black text-white mt-1 font-mono">
                  <span className="text-lg text-blue-400 font-medium mr-1">Rp</span>
                  {pph21DisplayTax.toLocaleString('id-ID')}
                </p>
                {isAnnual && annualPph21Result.overpaidTax > 0 && (
                  <p className="mt-2 text-xs font-bold text-emerald-300">
                    Lebih bayar {formatRupiah(annualPph21Result.overpaidTax)}
                  </p>
                )}
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAnnual ? 'Penghasilan Bruto Setahun:' : 'Penghasilan Bruto Bulanan:'}</span>
                  <span className="font-semibold text-slate-300 font-mono">Rp {grossIncome.toLocaleString('id-ID')}</span>
                </div>
                {isAnnual ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Pengurang:</span>
                      <span className="font-semibold text-slate-300 font-mono">Rp {totalPengurang.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Neto Sebelumnya:</span>
                      <span className="font-semibold text-slate-300 font-mono">Rp {annualPph21Result.previousNetIncome.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Neto Setahun:</span>
                      <span className="font-semibold text-slate-300 font-mono">Rp {annualPph21Result.netIncomeForTax.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/50 pb-2">
                      <span className="text-slate-500">PTKP ({ptkpStatus}):</span>
                      <span className="font-semibold text-slate-300 font-mono">Rp {ptkpValue.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 font-bold">
                      <span className="text-slate-400 flex items-center">
                        PKP (Kena Pajak):
                        <Tooltip content="Penghasilan Kena Pajak. Hasil sisa pendapatan bersih setelah dikurangi PTKP yang digunakan sebagai basis pengenaan PPh." />
                      </span>
                      <span className="text-white font-mono">Rp {pkp.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">PPh 21 Setahun:</span>
                      <span className="font-semibold text-slate-300 font-mono">Rp {annualPph21Result.annualTax.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kredit Pajak:</span>
                      <span className="font-semibold text-slate-300 font-mono">Rp {annualPph21Result.withheldTaxCredit.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center">
                        Kategori TER Bulanan:
                        <Tooltip content="Kategori TER berdasarkan status PTKP Anda di awal tahun." />
                      </span>
                      <span className="font-semibold text-blue-400">Kategori {terCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center">
                        Tarif Efektif TER:
                        <Tooltip content="Tarif persentase TER bulanan berdasarkan PP 58/2023." />
                      </span>
                      <span className="font-semibold text-indigo-400 font-mono">{(terRate * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/50 pt-2 font-bold">
                      <span className="text-slate-400 flex items-center">
                        Batas PTKP Acuan:
                        <Tooltip content="Acuan batasan PTKP awal tahun untuk mengkategorikan TER (Kategori A, B, atau C)." />
                      </span>
                      <span className="text-white font-mono">Rp {ptkpValue.toLocaleString('id-ID')} ({ptkpStatus})</span>
                    </div>
                  </>
                )}
              </div>

              {serverError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-xl font-medium">
                  {serverError.message}
                </div>
              )}

              <div className="space-y-2.5 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all text-xs uppercase tracking-wider border border-slate-750"
                    disabled={isPending}
                  >
                    Edit Data
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave('draft')}
                    className="w-full py-3.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 font-bold rounded-xl transition-all text-xs uppercase tracking-wider"
                    disabled={isPending}
                  >
                    Simpan Draf
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleSave('submitted')}
                  className="relative w-full overflow-hidden rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 outline-none group/btn text-xs tracking-wider uppercase"
                  disabled={isPending}
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                  {isPending ? 'Mengirim Data...' : 'Submit Resmi Laporan'}
                </button>
                <div className="flex justify-center sm:hidden">
                  {stepTracker}
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
