'use client';

import { useTaxpayerStore } from '@/store/useTaxpayerStore';
import { useMutateReport } from '@/hooks/useMutateReport';
import { calculateProgressiveTax, PTKP_VALUES, normalizePtkpStatus, calculatePph21TidakFinal, calculateCorporateIncomeTax } from '@/lib/taxEngine';
import { useFetchIncomeSources } from '@/hooks/useIncomeSources';
import { IncomeSource } from '@/types/taxpayer';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAlert } from '@/contexts/AlertContext';

interface IncomeSimulationPanelProps {
  taxYear: number;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
  '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
  '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
};

export default function IncomeSimulationPanel({ taxYear }: IncomeSimulationPanelProps) {
  const { data: _sources = [] } = useFetchIncomeSources(taxYear);
  const sources = _sources as IncomeSource[];
  const { profile } = useTaxpayerStore();
  const { showAlert } = useAlert();
  
  // Derive PTKP status from profile, fallback to TK/0
  const ptkpStatus = profile 
    ? `${(profile.maritalStatus === 'kawin' || profile.maritalStatus === 'menikah') ? 'K' : 'TK'}/${Math.min(3, Math.max(0, profile.dependents || 0))}`
    : 'TK/0';
  const { mutate, isPending } = useMutateReport();

  // Aggregation Logic with Advanced Rules
  const analysis = useMemo(() => {
    let progressiveGross = 0;
    let pekerjaanTetapGross = 0;
    let totalWithheldCredit = 0;

    let totalUmkmOmzet = 0;
    let totalUmkmTax = 0;

    let totalSewaFinal = 0;
    let totalSewaPph23 = 0;
    let totalInvestasiFinal = 0;
    let totalInvestasiPph23 = 0;
    let totalInvestasiPph26 = 0;
    let totalUnifikasiLainnya = 0;
    let totalPphBadan = 0;

    const warnings: string[] = [];
    const hasPekerjaanBebas = sources.some(s => s.sourceType === 'pekerjaan_bebas');

    for (const s of sources) {
      if (s.isTaxWithheld) {
        totalWithheldCredit += s.withheldAmount || 0;
      }

      if (s.sourceType === 'pekerjaan_tetap') {
        progressiveGross += s.annualIncome;
        pekerjaanTetapGross += s.annualIncome;
      } 
      else if (s.sourceType === 'pekerjaan_bebas') {
        // NPPN Assumption 50% for Freelancers if Category allows 50%
        const cat = s.metadata?.tidakFinalCategory as any || '21-100-07';
        const hasNpwp = Boolean(s.metadata?.tidakFinalHasNpwp ?? true);
        const result = calculatePph21TidakFinal(s.annualIncome, cat, hasNpwp);
        progressiveGross += result.dpp;
      } 
      else if (s.sourceType === 'usaha') {
        const corpMode = s.metadata?.corporateTaxMode || 'general';
        if (corpMode !== 'umkm_final' && corpMode !== 'umkm_individual') {
          // PPh Badan Normal
          const corpTax = calculateCorporateIncomeTax(s.annualIncome, s.annualIncome, true, corpMode as any).tax;
          totalPphBadan += corpTax;
          warnings.push(`Usaha '${s.sourceName}': Menggunakan tarif PPh Badan (${corpMode}).`);
        } else if (hasPekerjaanBebas) {
          progressiveGross += s.annualIncome * 0.50; // Forced to Norma 50%
          warnings.push(`Usaha '${s.sourceName}': Digabung ke Progresif karena Anda memiliki Pekerjaan Bebas.`);
        } else if (s.registrationYearForUmkm && (taxYear - s.registrationYearForUmkm > 7)) {
          progressiveGross += s.annualIncome;
          warnings.push(`Usaha '${s.sourceName}': Tarif 0.5% Kadaluarsa (>7 tahun). Dialihkan ke Progresif.`);
        } else {
          totalUmkmOmzet += s.annualIncome;
        }
      }
      else if (s.sourceType === 'sewa') {
        if (s.metadata?.sewaKategori === 'pph23') {
          totalSewaPph23 += s.annualIncome;
        } else {
          totalSewaFinal += s.annualIncome;
        }
      }
      else if (s.sourceType === 'investasi') {
        if (s.metadata?.investasiKategori === 'investasi_bunga') {
          totalInvestasiPph23 += s.annualIncome;
        } else if (s.metadata?.investasiKategori === 'investasi_luar_negeri') {
          totalInvestasiPph26 += s.annualIncome;
        } else {
          totalInvestasiFinal += s.annualIncome;
        }
      }
      else if (s.sourceType === 'lainnya') {
        totalUnifikasiLainnya += s.annualIncome;
      }
    }

    const biayaJabatan = Math.min(pekerjaanTetapGross * 0.05, 6000000);
    const netProgressive = Math.max(0, progressiveGross - biayaJabatan);
    const ptkpValue = PTKP_VALUES[normalizePtkpStatus(ptkpStatus)];
    const pkp = Math.floor(Math.max(0, netProgressive - ptkpValue) / 1000) * 1000;
    const progressiveTax = calculateProgressiveTax(pkp);

    if (totalUmkmOmzet > 500000000) {
      totalUmkmTax = (totalUmkmOmzet - 500000000) * 0.005;
    }

    const sewaFinalTax = totalSewaFinal * 0.10;
    const investasiFinalTax = totalInvestasiFinal * 0.10;
    const pph23Tax = (totalSewaPph23 * 0.02) + (totalInvestasiPph23 * 0.15);
    const pph26Tax = totalInvestasiPph26 * 0.20;
    const unifikasiTax = totalUnifikasiLainnya * 0.02; // Average fallback

    const totalFinalTax = totalUmkmTax + sewaFinalTax + investasiFinalTax;
    const totalOtherTax = pph23Tax + pph26Tax + unifikasiTax + totalPphBadan;

    const netTaxDue = Math.max(0, (progressiveTax + totalOtherTax) - totalWithheldCredit);

    return {
      progressiveGross, pekerjaanTetapGross, biayaJabatan, netProgressive, pkp, progressiveTax,
      totalUmkmOmzet, totalUmkmTax, totalFinalTax,
      totalOtherTax, totalWithheldCredit, netTaxDue, totalPphBadan,
      warnings
    };
  }, [sources, taxYear, ptkpStatus]);

  const handleSave = (status: 'draft' | 'submitted') => {
    mutate({
      taxYear,
      taxPeriod: '12',
      grossIncome: analysis.progressiveGross + analysis.totalUmkmOmzet,
      ptkpStatus: ptkpStatus as any,
      pensionContribution: 0,
      status,
    }, {
      onSuccess: () => {
        showAlert(
          status === 'submitted' ? 'Laporan Terkirim' : 'Draf Tersimpan',
          status === 'submitted'
            ? 'Laporan resmi perpajakan Anda berhasil disubmit dan siap dipantau dari riwayat.'
            : 'Simulasi pajak berhasil disimpan sebagai draf. Anda bisa melanjutkannya kembali kapan saja.',
          status === 'submitted' ? 'info' : 'warning'
        );
      }
    });
  };

  if (sources.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-blue-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Simulasi Total Pajak ({taxYear})</h2>
        <p className="text-sm text-slate-400 mt-1">Estimasi komprehensif SPT Tahunan berdasarkan seluruh sumber penghasilan Anda.</p>
      </div>

      {analysis.warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
          <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Peringatan Sistem</p>
          <ul className="list-disc pl-4 text-xs text-amber-400 space-y-1">
            {analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="px-6 pb-6 pt-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-4">
            <h4 className="text-[15px] font-bold text-slate-400 uppercase tracking-wider mb-4">Penghasilan Progresif (UU HPP Ps 17)</h4>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total Penghasilan (DPP)</span>
              <span className="font-mono text-white">Rp {analysis.progressiveGross.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Biaya Jabatan Maks</span>
              <span className="font-mono text-red-400">- Rp {analysis.biayaJabatan.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">PTKP ({ptkpStatus})</span>
              <span className="font-mono text-red-400">- Rp {PTKP_VALUES[normalizePtkpStatus(ptkpStatus)].toLocaleString('id-ID')}</span>
            </div>
            <div className="border-t border-slate-800/80 pt-2 !mt-3 flex justify-between text-sm font-bold">
              <span className="text-slate-300">Penghasilan Kena Pajak</span>
              <span className="font-mono text-white">Rp {analysis.pkp.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-blue-400">Pajak Progresif Terutang</span>
              <span className="font-mono text-blue-400">Rp {analysis.progressiveTax.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="px-6 pb-6 pt-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-4">
             <h4 className="text-[15px] font-bold text-slate-400 uppercase tracking-wider mb-4">Pajak Final & Potong Pungut Lainnya</h4>
             <div className="flex justify-between text-sm">
              <span className="text-slate-400">UMKM PP 23 (Omzet: Rp {analysis.totalUmkmOmzet.toLocaleString()})</span>
              <span className="font-mono text-emerald-400">Rp {analysis.totalUmkmTax.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total PPh Final (Sewa, Dividen)</span>
              <span className="font-mono text-emerald-400">Rp {analysis.totalFinalTax.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total PPh 23/26/Unifikasi</span>
              <span className="font-mono text-indigo-400">Rp {analysis.totalOtherTax.toLocaleString('id-ID')}</span>
            </div>
            {analysis.totalPphBadan > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total PPh Badan (Tarif Umum)</span>
                <span className="font-mono text-indigo-400">Rp {analysis.totalPphBadan.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-slate-800/80 pt-2 !mt-3">
              <span className="text-slate-400 font-bold">Kredit Pajak (Sudah Dipotong)</span>
              <span className="font-mono text-emerald-400 font-bold">- Rp {analysis.totalWithheldCredit.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-blue-600/10 border border-blue-500/30 rounded-2xl p-6 gap-6">
        <div>
          <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-wider">Total Kurang Bayar</h4>
          <div className="text-3xl font-black text-white font-mono mt-1 drop-shadow-md">
            Rp {analysis.netTaxDue.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => handleSave('draft')}
            disabled={isPending}
            className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all text-xs uppercase tracking-wider shadow-lg shadow-amber-600/30"
          >
            Simpan Draf
          </button>
          <button
            onClick={() => handleSave('submitted')}
            disabled={isPending}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            {isPending ? 'Memproses...' : 'Selesaikan Laporan'}
            {!isPending && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
          </button>
        </div>
      </div>

      {sources.some((s) => s.metadata?.taxPeriod && s.isTaxWithheld) && (
        <div className="pt-6 mt-6 border-t border-slate-800/80 animate-in fade-in duration-300">
          <div className="mb-4">
            <h3 className="text-lg font-extrabold text-white">Ringkasan SPT Masa (Bulanan)</h3>
            <p className="text-xs text-slate-400 mt-1">Akumulasi PPh yang telah dipotong per bulan pada tahun pajak berjalan.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }, (_, i) => {
              const monthStr = (i + 1).toString().padStart(2, '0');
              const monthSources = sources.filter((s) => s.metadata?.taxPeriod === monthStr && s.isTaxWithheld);
              if (monthSources.length === 0) return null;
              
              const totalMonthlyWithheld = monthSources.reduce((acc, curr) => acc + (curr.withheldAmount || 0), 0);
              const totalMonthlyGross = monthSources.reduce((acc, curr) => acc + (curr.annualIncome || 0), 0);
              
              return (
                <div key={monthStr} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 hover:border-blue-500/50 transition-colors">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{MONTH_NAMES[monthStr]}</div>
                  <div className="text-[10px] text-slate-300 font-mono mb-1">Bruto: Rp {totalMonthlyGross.toLocaleString('id-ID')}</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono border-t border-slate-800/80 pt-1 mt-1">Rp {totalMonthlyWithheld.toLocaleString('id-ID')}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

      {/* Educational Summary Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-3xl blur-xl opacity-50 transition-opacity duration-500 group-hover:opacity-100"></div>
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <h3 className="text-xl font-black bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                Edukasi: Memahami Perhitungan Anda
              </h3>
              <p className="text-sm text-blue-200/70 mt-1">Mengapa angka pajak Anda seperti ini?</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {/* Penjelasan Biaya Jabatan */}
            <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-5 hover:border-blue-500/30 transition-colors">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Penjelasan Biaya Jabatan
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Menurut UU HPP, <strong>Biaya Jabatan (5%) hanya berhak dikurangkan dari penghasilan yang bersumber dari Pekerjaan Tetap (Karyawan)</strong>, dengan batas maksimal Rp 6.000.000 per tahun.
              </p>
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-xs font-mono">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Total DPP Progresif:</span>
                  <span>Rp {analysis.progressiveGross.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Porsi Pekerjaan Tetap:</span>
                  <span>Rp {analysis.pekerjaanTetapGross.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-blue-400 font-bold border-t border-slate-700 pt-1 mt-1">
                  <span>Biaya Jabatan (5% dari Porsi Tetap):</span>
                  <span>Rp {analysis.biayaJabatan.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Penjelasan Kurang Bayar */}
            <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-5 hover:border-amber-500/30 transition-colors">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${analysis.netTaxDue > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                Status SPT: {analysis.netTaxDue > 0 ? 'Kurang Bayar' : analysis.netTaxDue === 0 ? 'Nihil' : 'Lebih Bayar'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {analysis.netTaxDue > 0 
                  ? 'Anda berstatus Kurang Bayar karena total PPh Terutang Anda lebih besar dari total kredit pajak (pajak yang sudah dipotong oleh pihak lain / perusahaan Anda) sepanjang tahun ini.'
                  : analysis.netTaxDue === 0 
                  ? 'Selamat! Status Anda Nihil. Artinya pajak yang telah dipotong oleh pihak lain sudah pas dengan total kewajiban pajak tahunan Anda.'
                  : 'Status Anda Lebih Bayar. Anda telah dipotong pajak lebih besar dari seharusnya.'}
              </p>
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 text-xs font-mono">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Total PPh Progresif & Final:</span>
                  <span>Rp {(analysis.progressiveTax + analysis.totalFinalTax).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 mb-1">
                  <span>Kredit Pajak (Sudah Dipotong):</span>
                  <span>- Rp {analysis.totalWithheldCredit.toLocaleString('id-ID')}</span>
                </div>
                <div className={`flex justify-between font-bold border-t border-slate-700 pt-1 mt-1 ${analysis.netTaxDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  <span>{analysis.netTaxDue > 0 ? 'Sisa Wajib Dibayar:' : 'Status:'}</span>
                  <span>Rp {analysis.netTaxDue.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
