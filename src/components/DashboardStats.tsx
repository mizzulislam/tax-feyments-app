import { TaxReportData } from '@/hooks/useFetchReports';
import { useFetchIncomeSources } from '@/hooks/useIncomeSources';
import { useDemoStore } from '@/store/useDemoStore';
import Link from 'next/link';
import { IncomeSource } from '@/types/taxpayer';

export default function DashboardStats({ data }: { data: TaxReportData[] }) {
  const { data: _incomeSources } = useFetchIncomeSources();
  const incomeSources = _incomeSources as IncomeSource[] | undefined;
  const { isDemoMode } = useDemoStore();

  const totalDraftPayable = isDemoMode 
    ? 2450000 
    : data.filter((report) => report.status === 'draft').reduce((sum, current) => sum + current.tax_payable, 0);

  const totalSubmitted = isDemoMode ? 0 : data.filter((report) => report.status === 'submitted').length;
  const totalLegacyPaid = isDemoMode ? 2 : data.filter((report) => report.status === 'paid').length;

  // Kalkulasi dari sumber penghasilan multi
  const totalCombinedIncome = isDemoMode 
    ? 150000000 // Mock value for demo
    : (incomeSources || []).reduce((sum, item) => sum + item.annualIncome, 0);
    
  const totalWithheldTax = isDemoMode 
    ? 1500000 
    : (incomeSources || []).reduce((sum, item) => sum + (item.isTaxWithheld ? item.withheldAmount : 0), 0);

  // Hitung Tarif Efektif Pajak (ETR) dari sumber penghasilan
  const rawETR = isDemoMode 
    ? 1.57 
    : (totalCombinedIncome > 0 ? (totalWithheldTax / totalCombinedIncome) * 100 : 0);

  return (
    <div className="grid grid-cols-2 gap-2.5 md:gap-6">

      {/* Card 1 - Didokumentasikan */}
      <Link href="/dashboard/documents" className="group relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 md:p-5 lg:p-6 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:shadow-2xl hover:shadow-blue-500/10 block cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-blue-400/90 uppercase tracking-widest leading-tight">Berkas Pajak</span>
          </div>
          <p className="text-xl md:text-3xl font-bold text-white tracking-tight leading-tight">
            {totalSubmitted} <span className="text-slate-500 text-xs md:text-base font-medium">Dokumen</span>
          </p>
          <p className="text-[10px] md:text-xs text-slate-500 mt-2 md:mt-3 leading-snug group-hover:text-slate-400 transition-colors">Manajemen berkas perpajakan</p>
        </div>
      </Link>

      {/* Card 2 - Tarif Efektif Rata-Rata */}
      <Link href="/dashboard/income" className="group relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 md:p-5 lg:p-6 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:shadow-2xl hover:shadow-violet-500/10 block cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 11h.01M12 7h.01M15 11h.01M15 7h.01M9 11h.01M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2z"></path></svg>
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-violet-400/90 uppercase tracking-widest leading-tight">Rasio Efektif</span>
          </div>
          <p className="text-xl md:text-3xl font-bold text-white tracking-tight leading-tight">
            {rawETR.toFixed(2)}<span className="text-slate-500 text-xs md:text-base font-medium">% ETR</span>
          </p>
          <p className="text-[10px] md:text-xs text-slate-500 mt-2 md:mt-3 leading-snug group-hover:text-slate-400 transition-colors">Beban pajak dari multi-sumber</p>
        </div>
      </Link>

      {/* Card 3 - Total Penghasilan Gabungan */}
      <Link href="/dashboard/income" className="group relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 md:p-5 lg:p-6 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:shadow-2xl hover:shadow-fuchsia-500/10 block cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.1)]">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-fuchsia-400/90 uppercase tracking-widest leading-tight">Bruto Gabungan</span>
          </div>
          <p className="text-xl md:text-3xl font-bold text-white tracking-tight leading-tight break-words">
            <span className="text-slate-500 text-sm md:text-lg mr-1">Rp</span>
            {totalCombinedIncome.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] md:text-xs text-slate-500 mt-2 md:mt-3 leading-snug group-hover:text-slate-400 transition-colors">Penghasilan multi-sumber</p>
        </div>
      </Link>

      {/* Card 4 - Total Kredit Pajak */}
      <Link href="/dashboard/income" className="group relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-4 md:p-5 lg:p-6 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:shadow-2xl hover:shadow-cyan-500/10 block cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            </div>
            <span className="text-[10px] md:text-xs font-semibold text-cyan-400/90 uppercase tracking-widest leading-tight">Kredit Pajak</span>
          </div>
          <p className="text-xl md:text-3xl font-bold text-white tracking-tight leading-tight break-words">
            <span className="text-slate-500 text-sm md:text-lg mr-1">Rp</span>
            {totalWithheldTax.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] md:text-xs text-slate-500 mt-2 md:mt-3 leading-snug group-hover:text-slate-400 transition-colors">Pajak dipotong pihak lain</p>
        </div>
      </Link>

    </div>
  );
}
