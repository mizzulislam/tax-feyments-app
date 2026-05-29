'use client';

import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incomeSourceSchema, IncomeSourceInput } from '@/types/taxpayer';
import { useMutateIncomeSource } from '@/hooks/useIncomeSources';
import { useEffect } from 'react';
import Tooltip from './Tooltip';
import { useAlert } from '@/contexts/AlertContext';
import type { z } from 'zod';
import { ModernSelect, SelectOption } from '@/components/ui/ModernSelect';
import { useTaxpayerStore } from '@/store/useTaxpayerStore';
import {
  PTKP_VALUES,
  calculateAnnualPph21,
  calculateMonthlyTerTax,
  calculatePph23,
  calculatePph26,
  calculatePphUnification,
  calculateFinalTax,
  calculateCorporateIncomeTax,
  type PtkpStatus,
} from '@/lib/taxEngine';

const formatNumberInput = (value: number) => value > 0 ? Math.round(value).toLocaleString('id-ID') : '';
const parseFormattedNumber = (value: string) => {
  const normalized = value.replace(/[^\d]/g, '');
  return normalized ? Number(normalized) : 0;
};

const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};

const currentYear = new Date().getFullYear();

function SchemeRadioPicker<T extends string | boolean>({
  value,
  onChange,
  options
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; tooltip?: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
      {options.map((option, index) => {
        const selected = value === option.value;
        return (
          <div
            key={String(option.value) + index}
            onClick={() => onChange(option.value)}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left outline-none transition focus:ring-2 focus:ring-blue-500/30 ${
              selected
                ? 'border-blue-500/70 bg-blue-500/10 text-white shadow-lg shadow-blue-950/20'
                : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-blue-500/45 hover:bg-slate-950/70'
            }`}
            role="radio"
            aria-checked={selected}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-blue-400' : 'border-slate-500'}`}>
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-blue-400"></span>}
              </span>
              <span className="truncate text-sm font-bold">{option.label}</span>
            </span>
            {option.tooltip && <Tooltip content={option.tooltip} align={index % 2 !== 0 ? 'right' : 'center'} />}
          </div>
        );
      })}
    </div>
  );
}

const taxPeriodOptions: SelectOption[] = [
  { value: '01', label: 'Januari' }, { value: '02', label: 'Februari' }, { value: '03', label: 'Maret' },
  { value: '04', label: 'April' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' }, { value: '08', label: 'Agustus' }, { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

const ptkpOptions: SelectOption[] = [
  { value: 'TK/0', label: 'TK/0' }, { value: 'TK/1', label: 'TK/1' }, { value: 'TK/2', label: 'TK/2' }, { value: 'TK/3', label: 'TK/3' },
  { value: 'K/0', label: 'K/0' }, { value: 'K/1', label: 'K/1' }, { value: 'K/2', label: 'K/2' }, { value: 'K/3', label: 'K/3' },
];

const jenisPemotonganOptions: SelectOption[] = [
  { value: 'bulanan', label: 'PPh 21 Bulanan' },
  { value: 'tahunan', label: 'PPh 21 Tahunan' },
];

const pph21TidakFinalOptions: SelectOption[] = [
  { value: '21-100-03', label: '21-100-03 Pegawai Tidak Tetap' },
  { value: '21-100-04', label: '21-100-04 Distributor Pemasaran Berjenjang' },
  { value: '21-100-05', label: '21-100-05 Agen Asuransi' },
  { value: '21-100-06', label: '21-100-06 Penjaja Barang Dagangan' },
  { value: '21-100-07', label: '21-100-07 Tenaga Ahli' },
  { value: '21-100-08', label: '21-100-08 Seniman' },
  { value: '21-100-09', label: '21-100-09 Bukan Pegawai Lainnya' },
];

const corporateTaxModeOptions: SelectOption[] = [
  { value: 'general', label: 'WP Badan umum - 22%' },
  { value: 'public_company', label: 'Perseroan terbuka - 19%' },
  { value: 'umkm_final', label: 'Badan UMKM final - 0,5% omzet' },
];

const pph23SewaOptions: SelectOption[] = [
  { value: 'pphFinal', label: 'Sewa Tanah/Bangunan (PPh Final 10%)' },
  { value: 'pph23', label: 'Sewa Harta Lainnya (PPh 23 - 2%)' },
];

const investasiOptions: SelectOption[] = [
  { value: 'investasi_dividen', label: 'Dividen (PPh Final - 10%)' },
  { value: 'investasi_bunga', label: 'Bunga/Royalti (PPh 23 - 15%)' },
  { value: 'investasi_luar_negeri', label: 'Subjek Luar Negeri (PPh 26 - 20%)' },
];

const pphUnificationOptions: SelectOption[] = [
  { value: 'pph22_government_goods', label: 'PPh 22 Bendahara Pemerintah - 1,5%' },
  { value: 'pph22_import_api', label: 'PPh 22 Impor API - 2,5%' },
  { value: 'pph22_import_non_api', label: 'PPh 22 Impor Non-API - 7,5%' },
  { value: 'pph4_land_building_transfer', label: 'PPh 4(2) Pengalihan Tanah/Bangunan - 2,5%' },
  { value: 'pph15_domestic_shipping', label: 'PPh 15 Pelayaran Dalam Negeri - 1,2%' },
];

type IncomeSourceFormValues = z.infer<typeof incomeSourceSchema>;

interface IncomeSourceFormProps {
  editSource?: { id: string } & IncomeSourceInput;
  onSuccess?: () => void;
  onCancel?: () => void;
  activeTaxYear?: number;
}

export default function IncomeSourceForm({
  editSource,
  onSuccess,
  onCancel,
  activeTaxYear = new Date().getFullYear(),
}: IncomeSourceFormProps) {
  const { mutate, isPending, error: mutationError } = useMutateIncomeSource();
  const { profile } = useTaxpayerStore();
  const { showAlert } = useAlert();

  const globalPtkpStatus = profile 
    ? `${(profile.maritalStatus === 'kawin' || profile.maritalStatus === 'menikah') ? 'K' : 'TK'}/${Math.min(3, Math.max(0, profile.dependents || 0))}`
    : 'TK/0';

  const defaultEmptyState = {
    sourceName: '',
    sourceType: 'pekerjaan_tetap' as const,
    annualIncome: 0,
    taxYear: activeTaxYear,
    npwpPemotong: '',
    namaPemotong: '',
    isTaxWithheld: false,
    withheldAmount: 0,
    registrationYearForUmkm: null,
    notes: '',
    metadata: {
      jenisPemotongan: 'bulanan',
      taxPeriod: '01',
      isGrossUp: false,
      ptkpStatus: globalPtkpStatus,
      tidakFinalCategory: '21-100-07',
      tidakFinalHasNpwp: true,
      sewaKategori: 'pphFinal',
      investasiKategori: 'investasi_dividen',
      lainnyaKategori: 'pph22_government_goods',
      gaji: 0,
      tunjangan: 0,
      bonus: 0,
      iuranPensiun: 0,
      zakatSumbangan: 0,
      tahunanGaji: 0,
      tahunanTunjanganPph: 0,
      tahunanTunjanganLainnya: 0,
      tahunanHonorarium: 0,
      tahunanPremiAsuransi: 0,
      tahunanNatura: 0,
      tahunanBonus: 0,
      previousNetIncome: 0,
      corporateTaxMode: 'general',
    },
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<IncomeSourceFormValues>({
    resolver: zodResolver(incomeSourceSchema) as any,
    defaultValues: defaultEmptyState,
  });

  const isTaxWithheld = useWatch({ control, name: 'isTaxWithheld' });
  const annualIncome = useWatch({ control, name: 'annualIncome' }) || 0;
  const sourceType = useWatch({ control, name: 'sourceType' });
  const metadata = useWatch({ control, name: 'metadata' }) as any || {};

  // For pekerjaan_tetap
  const jenisPemotongan = metadata?.jenisPemotongan || 'bulanan';
  const isGrossUp = metadata?.isGrossUp || false;
  const ptkpStatus = (metadata?.ptkpStatus || globalPtkpStatus) as PtkpStatus;

  useEffect(() => {
    if (sourceType === 'pekerjaan_tetap') {
      if (jenisPemotongan === 'bulanan') {
        const total = (metadata?.gaji || 0) + (metadata?.tunjangan || 0) + (metadata?.bonus || 0);
        setValue('annualIncome', total);
      } else {
        const total = (metadata?.tahunanGaji || 0) + (metadata?.tahunanTunjanganPph || 0) + (metadata?.tahunanTunjanganLainnya || 0) + (metadata?.tahunanHonorarium || 0) + (metadata?.tahunanPremiAsuransi || 0) + (metadata?.tahunanNatura || 0) + (metadata?.tahunanBonus || 0);
        setValue('annualIncome', total);
      }
    }
  }, [sourceType, jenisPemotongan, metadata?.gaji, metadata?.tunjangan, metadata?.bonus, metadata?.tahunanGaji, metadata?.tahunanTunjanganPph, metadata?.tahunanTunjanganLainnya, metadata?.tahunanHonorarium, metadata?.tahunanPremiAsuransi, metadata?.tahunanNatura, metadata?.tahunanBonus, setValue]);

  useEffect(() => {
    if (editSource) {
      reset({
        ...editSource,
        metadata: {
          jenisPemotongan: 'bulanan',
          taxPeriod: '01',
          isGrossUp: false,
          ptkpStatus: globalPtkpStatus,
          tidakFinalCategory: '21-100-07',
          tidakFinalHasNpwp: true,
          sewaKategori: 'pphFinal',
          investasiKategori: 'investasi_dividen',
          lainnyaKategori: 'pph22_government_goods',
          gaji: editSource.sourceType === 'pekerjaan_tetap' ? editSource.annualIncome : 0,
          tunjangan: 0,
          bonus: 0,
          iuranPensiun: 0,
          zakatSumbangan: 0,
          tahunanGaji: 0,
          tahunanTunjanganPph: 0,
          tahunanTunjanganLainnya: 0,
          tahunanHonorarium: 0,
          tahunanPremiAsuransi: 0,
          tahunanNatura: 0,
          tahunanBonus: 0,
          previousNetIncome: 0,
          corporateTaxMode: 'general',
          ...editSource.metadata
        },
      });
    }
  }, [editSource, reset, globalPtkpStatus]);

  useEffect(() => {
    if (isTaxWithheld && annualIncome >= 0) {
      let estimatedTax = 0;
      
      if (sourceType === 'pekerjaan_tetap') {
        const grossIncome = annualIncome;
        if (jenisPemotongan === 'bulanan') {
          let pph21TaxAllowance = 0;
          if (isGrossUp) {
            for (let i = 0; i < 24; i++) {
              const nextAllowance = calculateMonthlyTerTax(grossIncome + pph21TaxAllowance, ptkpStatus);
              if (nextAllowance === pph21TaxAllowance) break;
              pph21TaxAllowance = nextAllowance;
            }
          }
          estimatedTax = calculateMonthlyTerTax(grossIncome + pph21TaxAllowance, ptkpStatus);
        } else {
          const annualPph21BaseInput = {
            grossIncome,
            ptkpStatus,
            pensionContribution: metadata?.iuranPensiun || 0,
            religiousContribution: metadata?.zakatSumbangan || 0,
            previousNetIncome: metadata?.previousNetIncome || 0,
            withheldTaxCredit: 0,
          };
          let pph21TaxAllowance = 0;
          if (isGrossUp) {
            for (let i = 0; i < 24; i++) {
              const nextResult = calculateAnnualPph21({
                ...annualPph21BaseInput,
                grossIncome: grossIncome + pph21TaxAllowance,
              });
              if (nextResult.taxDue === pph21TaxAllowance) break;
              pph21TaxAllowance = nextResult.taxDue;
            }
          }
          estimatedTax = calculateAnnualPph21({
            ...annualPph21BaseInput,
            grossIncome: grossIncome + pph21TaxAllowance,
          }).taxDue;
        }
      } else if (sourceType === 'pekerjaan_bebas') {
        estimatedTax = Math.round(annualIncome * 0.025); // simplification for UI
      } else if (sourceType === 'usaha') {
        if (metadata?.corporateTaxMode === 'umkm_final') {
          estimatedTax = Math.max(0, (annualIncome - 500000000) * 0.005);
        } else {
          estimatedTax = calculateCorporateIncomeTax(annualIncome, annualIncome, true, metadata?.corporateTaxMode || 'general').tax;
        }
      } else if (sourceType === 'sewa') {
        if (metadata?.sewaKategori === 'pph23') {
          estimatedTax = calculatePph23(annualIncome, 'service_rent', false, isGrossUp).tax;
        } else {
          estimatedTax = calculateFinalTax(annualIncome, 'land_building_rent', isGrossUp).tax;
        }
      } else if (sourceType === 'investasi') {
        if (metadata?.investasiKategori === 'investasi_bunga') {
          estimatedTax = calculatePph23(annualIncome, 'royalty_dividend_interest', false, isGrossUp).tax;
        } else if (metadata?.investasiKategori === 'investasi_luar_negeri') {
          estimatedTax = calculatePph26(annualIncome, 'gross_income', 0.20, isGrossUp).tax;
        } else {
          estimatedTax = Math.round(annualIncome * 0.10); // final dividen
        }
      } else if (sourceType === 'lainnya') {
        estimatedTax = calculatePphUnification(annualIncome, (metadata?.lainnyaKategori as any) || 'pph22_government_goods', false, isGrossUp).tax;
      }

      setValue('withheldAmount', Math.max(0, estimatedTax));
    } else if (!isTaxWithheld) {
      setValue('withheldAmount', 0);
      setValue('npwpPemotong', '');
      setValue('namaPemotong', '');
    }
  }, [isTaxWithheld, annualIncome, sourceType, metadata, jenisPemotongan, isGrossUp, ptkpStatus, setValue]);

  const onSubmit = (data: IncomeSourceFormValues) => {
    clearErrors();
    let hasError = false;

    if (data.sourceType === 'pekerjaan_tetap') {
      const meta = data.metadata as any;
      if (meta?.jenisPemotongan === 'bulanan') {
        if (!meta?.gaji || meta.gaji <= 0) {
          setError('metadata.gaji' as any, { type: 'manual', message: 'Gaji Pokok wajib diisi' });
          hasError = true;
        }
      }
    }

    if (data.isTaxWithheld) {
      if (!data.namaPemotong?.trim()) {
        setError('namaPemotong', { type: 'manual', message: 'Nama Pemotong wajib diisi' });
        hasError = true;
      }
      if (!data.npwpPemotong?.trim()) {
        setError('npwpPemotong', { type: 'manual', message: 'NPWP Pemotong wajib diisi' });
        hasError = true;
      }
    }

    if (hasError) return;

    const payload: IncomeSourceInput = {
      ...data,
      isTaxWithheld: data.isTaxWithheld ?? false,
      withheldAmount: data.withheldAmount ?? 0,
      registrationYearForUmkm: data.sourceType === 'usaha' ? data.registrationYearForUmkm || null : null,
    };
    mutate(
      {
        id: editSource?.id,
        ...payload,
      },
      {
        onSuccess: async () => {
          await showAlert('Berhasil Dicatat!', 'Data penghasilan Anda telah berhasil ditambahkan dan disimpan dengan aman.', 'success');
          reset(defaultEmptyState);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <div className="relative p-[1px] rounded-3xl group shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/30 via-indigo-500/5 to-transparent opacity-40 rounded-3xl"></div>
      
      <div className="relative bg-slate-900/85 backdrop-blur-2xl p-6 md:p-8 rounded-[23px] space-y-6">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none"></div>

        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {editSource ? 'Edit Sumber Penghasilan' : 'Catat Sumber Penghasilan'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Mencakup detail spesifik untuk perhitungan agregat kalkulator pajak.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
              Nama Sumber / Instansi <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register('sourceName')}
              placeholder="Contoh: PT Telkom Indonesia, Freelance UI Design"
              className={`w-full bg-slate-950/50 border text-white rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none transition-all font-medium ${errors.sourceName ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-800 focus:ring-blue-500/50 focus:border-blue-500'}`}
            />
            {errors.sourceName && <span className="text-xs text-red-500">{errors.sourceName.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                Kategori Utama
              </label>
              <Controller
                name="sourceType"
                control={control}
                render={({ field }) => (
                  <ModernSelect
                    value={field.value as any}
                    onChange={field.onChange}
                    className="z-50"
                    options={[
                      { value: 'pekerjaan_tetap', label: 'Pekerjaan Tetap (Gaji/PPh 21)' },
                      { value: 'pekerjaan_bebas', label: 'Pekerjaan Bebas (Freelance)' },
                      { value: 'usaha', label: 'Usaha / UMKM (PP 23) / Badan' },
                      { value: 'sewa', label: 'Sewa Properti / Harta' },
                      { value: 'investasi', label: 'Investasi (Dividen/Bunga)' },
                      { value: 'lainnya', label: 'Penghasilan Lainnya' },
                    ]}
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                Tahun Pajak
              </label>
              <input
                type="number"
                {...register('taxYear', { valueAsNumber: true })}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* DYNAMIC FIELDS BY SOURCE TYPE */}
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-4">
            
            {sourceType === 'pekerjaan_tetap' && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Pemotongan</label>
                    <Controller name="metadata.jenisPemotongan" control={control} render={({ field }) => (
                      <ModernSelect value={field.value as any} onChange={field.onChange} options={jenisPemotonganOptions} />
                    )} />
                  </div>
                  {jenisPemotongan === 'bulanan' ? (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Masa Pajak (Bulan)</label>
                      <Controller name="metadata.taxPeriod" control={control} render={({ field }) => (
                        <ModernSelect value={field.value as any} onChange={field.onChange} options={taxPeriodOptions} />
                      )} />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status PTKP</label>
                      <Controller name="metadata.ptkpStatus" control={control} render={({ field }) => (
                        <ModernSelect value={field.value as any} onChange={field.onChange} options={ptkpOptions} />
                      )} />
                    </div>
                  )}
                </div>

                {jenisPemotongan === 'bulanan' ? (
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Gaji Pokok <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                        <Controller name="metadata.gaji" control={control} render={({ field }) => (
                          <input type="text" inputMode="numeric" value={formatNumberInput(field.value as any)} onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))} className={`w-full bg-slate-950/50 border ${((errors.metadata as any)?.gaji) ? 'border-red-500' : 'border-slate-800'} text-white rounded-xl pl-9 pr-3 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono`} />
                        )} />
                      </div>
                      {((errors.metadata as any)?.gaji) && <span className="text-[10px] text-red-500">{String(((errors.metadata as any).gaji).message)}</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tunjangan</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                        <Controller name="metadata.tunjangan" control={control} render={({ field }) => (
                          <input type="text" inputMode="numeric" value={formatNumberInput(field.value as any)} onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))} className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                        )} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bonus / THR</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                        <Controller name="metadata.bonus" control={control} render={({ field }) => (
                          <input type="text" inputMode="numeric" value={formatNumberInput(field.value as any)} onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))} className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                        )} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gaji Setahun</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                        <Controller name="metadata.tahunanGaji" control={control} render={({ field }) => (
                          <input type="text" inputMode="numeric" value={formatNumberInput(field.value as any)} onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))} className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                        )} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tunjangan PPh</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                        <Controller name="metadata.tahunanTunjanganPph" control={control} render={({ field }) => (
                          <input type="text" inputMode="numeric" value={formatNumberInput(field.value as any)} onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))} className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                        )} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tunjangan Lainnya / Uang Lembur</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                        <Controller name="metadata.tahunanTunjanganLainnya" control={control} render={({ field }) => (
                          <input type="text" inputMode="numeric" value={formatNumberInput(field.value as any)} onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))} className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                        )} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Honorarium / Imbalan Lain</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                        <Controller name="metadata.tahunanHonorarium" control={control} render={({ field }) => (
                          <input type="text" inputMode="numeric" value={formatNumberInput(field.value as any)} onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))} className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                        )} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Iuran Pensiun / JHT Dibayar</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                        <Controller name="metadata.iuranPensiun" control={control} render={({ field }) => (
                          <input type="text" inputMode="numeric" value={formatNumberInput(field.value as any)} onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))} className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl pl-9 pr-3 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                        )} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 mt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skema Perhitungan</label>
                  <Controller name="metadata.isGrossUp" control={control} render={({ field }) => (
                    <SchemeRadioPicker value={field.value as any} onChange={field.onChange} options={[
                      { value: false, label: 'Gross', tooltip: 'Dipotong dari Penghasilan' },
                      { value: true, label: 'Gross Up', tooltip: 'Ditanggung Pemberi' }
                    ]} />
                  )} />
                </div>
              </>
            )}

            {sourceType === 'pekerjaan_bebas' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kode Objek Pajak</label>
                  <Controller name="metadata.tidakFinalCategory" control={control} render={({ field }) => (
                    <ModernSelect value={field.value as any} onChange={field.onChange} options={pph21TidakFinalOptions} />
                  )} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gunakan NPWP?</label>
                  <Controller name="metadata.tidakFinalHasNpwp" control={control} render={({ field }) => (
                    <ModernSelect value={field.value ? 'true' : 'false'} onChange={(val) => field.onChange(val === 'true')} options={[{value: 'true', label: 'Ya, Memiliki NPWP'}, {value: 'false', label: 'Tidak (Denda +20%)'}]} />
                  )} />
                </div>
              </div>
            )}

            {sourceType === 'sewa' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori Sewa</label>
                <Controller name="metadata.sewaKategori" control={control} render={({ field }) => (
                  <ModernSelect value={field.value as any} onChange={field.onChange} options={pph23SewaOptions} />
                )} />
              </div>
            )}

            {sourceType === 'investasi' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori Investasi</label>
                <Controller name="metadata.investasiKategori" control={control} render={({ field }) => (
                  <ModernSelect value={field.value as any} onChange={field.onChange} options={investasiOptions} />
                )} />
              </div>
            )}

            {sourceType === 'lainnya' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori Unifikasi Khusus</label>
                <Controller name="metadata.lainnyaKategori" control={control} render={({ field }) => (
                  <ModernSelect value={field.value as any} onChange={field.onChange} options={pphUnificationOptions} />
                )} />
              </div>
            )}

            {sourceType === 'usaha' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Skema Badan / Usaha</label>
                  <Controller name="metadata.corporateTaxMode" control={control} render={({ field }) => (
                    <ModernSelect value={field.value as any} onChange={field.onChange} options={corporateTaxModeOptions} />
                  )} />
                </div>
                <div className="space-y-1.5 mt-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    Tahun Mulai Terdaftar UMKM
                    <Tooltip content="Masa berlaku PPh Final 0.5% maksimal 7 tahun untuk Orang Pribadi sejak tahun terdaftar." />
                  </label>
                  <input
                    type="number"
                    {...register('registrationYearForUmkm', {
                      setValueAs: (value) => value === '' ? null : Number(value),
                    })}
                    placeholder={`Contoh: 2021`}
                    className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </>
            )}

            {['sewa', 'investasi', 'lainnya'].includes(sourceType) && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skema Perhitungan</label>
                <Controller name="metadata.isGrossUp" control={control} render={({ field }) => (
                  <SchemeRadioPicker value={field.value as any} onChange={field.onChange} options={[
                    { value: false, label: 'Gross', tooltip: 'Dipotong dari Penghasilan' },
                    { value: true, label: 'Gross Up', tooltip: 'Ditanggung Pemberi' }
                  ]} />
                )} />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                Penghasilan Bruto {sourceType === 'pekerjaan_tetap' && '(Otomatis)'} <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                <Controller
                  name="annualIncome"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      inputMode="numeric"
                      readOnly={sourceType === 'pekerjaan_tetap'}
                      value={formatNumberInput(field.value as any)}
                      onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))}
                      className={`w-full bg-slate-950/50 border text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 outline-none transition-all font-mono ${sourceType === 'pekerjaan_tetap' ? 'opacity-70 cursor-not-allowed border-slate-800 focus:ring-blue-500/50 focus:border-blue-500' : (errors.annualIncome ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-800 focus:ring-blue-500/50 focus:border-blue-500')}`}
                    />
                  )}
                />
              </div>
              {errors.annualIncome && <span className="text-xs text-red-500">{errors.annualIncome.message}</span>}
            </div>

          </div>

          {/* WITHHOLDING SECTION */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                Status Pemotongan PPh
              </label>
              <Controller
                name="isTaxWithheld"
                control={control}
                render={({ field }) => (
                  <SchemeRadioPicker
                    value={field.value as any}
                    onChange={field.onChange}
                    options={[
                      { value: false, label: 'Belum Dipotong', tooltip: 'Pajak dihitung di akhir tahun.' },
                      { value: true, label: 'Sudah Dipotong', tooltip: 'Pihak pemotong sudah menerbitkan Bukti Potong.' }
                    ]}
                  />
                )}
              />
            </div>

            {isTaxWithheld && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60 animate-in fade-in duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    Nama Pemotong <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="namaPemotong"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        placeholder="Nama Wajib Pajak"
                        className={`w-full bg-slate-950/40 border ${errors.namaPemotong ? 'border-red-500' : 'border-slate-800/80'} text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-medium`}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(toTitleCase(e.target.value))}
                      />
                    )}
                  />
                  {errors.namaPemotong && <span className="text-[10px] text-red-500">{errors.namaPemotong.message}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    NPWP Pemotong <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('npwpPemotong')}
                    maxLength={16}
                    placeholder="15/16 digit"
                    className={`w-full bg-slate-950/40 border ${errors.npwpPemotong ? 'border-red-500' : 'border-slate-800/80'} text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono`}
                  />
                  {errors.npwpPemotong && <span className="text-[10px] text-red-500">{errors.npwpPemotong.message}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    Nominal PPh Dipotong
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-semibold text-slate-500">Rp</span>
                    <Controller
                      name="withheldAmount"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberInput(field.value as any)}
                          onChange={(e) => field.onChange(parseFormattedNumber(e.target.value))}
                          className="w-full bg-slate-950/40 border border-slate-800/80 text-white rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {mutationError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-xl font-medium">
              {mutationError.message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {onCancel && (
              <button type="button" onClick={onCancel} className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-300 font-bold rounded-xl transition-all text-xs uppercase tracking-wider">
                Batal
              </button>
            )}
            <button type="submit" disabled={isPending} className="relative flex-1 overflow-hidden rounded-xl bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50 outline-none text-xs uppercase tracking-wider">
              {isPending ? 'Menyimpan...' : editSource ? 'Simpan Perubahan' : 'Catat Penghasilan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
