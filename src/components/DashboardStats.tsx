import { TaxReportData } from '@/hooks/useFetchReports';
import { useFetchIncomeSources } from '@/hooks/useIncomeSources';

export default function DashboardStats({ data }: { data: TaxReportData[] }) {
  const { data: incomeSources } = useFetchIncomeSources();
  const totalDraftPayable = data
    .filter((report) => report.status === 'draft')
    .reduce((sum, current) => sum + current.tax_payable, 0);

  const totalSubmitted = data.filter((report) => report.status === 'submitted').length;
  const totalPaid = data.filter((report) => report.status === 'paid').length;

  // Hitung Tarif Efektif Pajak (ETR) Rata-Rata Wajib Pajak
  const totalGross = data.reduce((sum, report) => sum + report.gross_income, 0);
  const totalTax = data.reduce((sum, report) => sum + report.tax_payable, 0);
  const rawETR = totalGross > 0 ? (totalTax / totalGross) * 100 : 0;

  // Kalkulasi dari sumber penghasilan multi
  const totalCombinedIncome = (incomeSources || []).reduce((sum, item) => sum + item.annualIncome, 0);
  const totalWithheldTax = (incomeSources || []).reduce((sum, item) => sum + (item.isTaxWithheld ? item.withheldAmount : 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-6">
      
      {/* Card 1 */}
      <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-3.5 md:p-8 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:shadow-2xl hover:shadow-orange-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="text-[10px] md:text-sm font-semibold text-orange-400/90 uppercase tracking-[0.14em] md:tracking-widest leading-tight">Draf Terutang</span>
          </div>
          <p className="text-lg sm:text-xl md:text-4xl font-bold text-white tracking-tight leading-tight break-words">
            <span className="text-slate-500 text-sm md:text-2xl mr-1">Rp</span>
            {totalDraftPayable.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-2 md:mt-4 leading-snug md:leading-relaxed group-hover:text-slate-400 transition-colors">Menunggu kode billing & pelaporan</p>
        </div>
      </div>

      {/* Card 2 */}
      <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-3.5 md:p-8 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:shadow-2xl hover:shadow-blue-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <span className="text-[10px] md:text-sm font-semibold text-blue-400/90 uppercase tracking-[0.14em] md:tracking-widest leading-tight">Disampaikan</span>
          </div>
          <p className="text-lg sm:text-xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            {totalSubmitted} <span className="text-slate-500 text-xs md:text-xl font-medium">Dokumen</span>
          </p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-2 md:mt-4 leading-snug md:leading-relaxed group-hover:text-slate-400 transition-colors">Proses review administrasi</p>
        </div>
      </div>

      {/* Card 3 */}
      <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-3.5 md:p-8 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:shadow-2xl hover:shadow-emerald-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="text-[10px] md:text-sm font-semibold text-emerald-400/90 uppercase tracking-[0.14em] md:tracking-widest leading-tight">Selesai</span>
          </div>
          <p className="text-lg sm:text-xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            {totalPaid} <span className="text-slate-500 text-xs md:text-xl font-medium">Sukses</span>
          </p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-2 md:mt-4 leading-snug md:leading-relaxed group-hover:text-slate-400 transition-colors">Sudah mendapat BPE</p>
        </div>
      </div>

      {/* Card 4 - Tarif Efektif Rata-Rata */}
      <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-3.5 md:p-8 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:shadow-2xl hover:shadow-violet-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 11h.01M12 7h.01M15 11h.01M15 7h.01M9 11h.01M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2z"></path></svg>
            </div>
            <span className="text-[10px] md:text-sm font-semibold text-violet-400/90 uppercase tracking-[0.14em] md:tracking-widest leading-tight">Rasio Efektif</span>
          </div>
          <p className="text-lg sm:text-xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            {rawETR.toFixed(2)}<span className="text-slate-500 text-xs md:text-xl font-medium">% ETR</span>
          </p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-2 md:mt-4 leading-snug md:leading-relaxed group-hover:text-slate-400 transition-colors">Beban pajak kotor</p>
        </div>
      </div>

      {/* Card 5 - Total Penghasilan Gabungan */}
      <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-3.5 md:p-8 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:shadow-2xl hover:shadow-fuchsia-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.1)]">
              <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="text-[10px] md:text-sm font-semibold text-fuchsia-400/90 uppercase tracking-[0.14em] md:tracking-widest leading-tight">Bruto Gabungan</span>
          </div>
          <p className="text-lg sm:text-xl md:text-4xl font-bold text-white tracking-tight leading-tight break-words">
            <span className="text-slate-500 text-sm md:text-2xl mr-1">Rp</span>
            {totalCombinedIncome.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-2 md:mt-4 leading-snug md:leading-relaxed group-hover:text-slate-400 transition-colors">Penghasilan multi-sumber</p>
        </div>
      </div>

      {/* Card 6 - Total Kredit Pajak */}
      <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-3.5 md:p-8 transition-all hover:bg-slate-800/50 hover:border-slate-700 hover:shadow-2xl hover:shadow-cyan-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            </div>
            <span className="text-[10px] md:text-sm font-semibold text-cyan-400/90 uppercase tracking-[0.14em] md:tracking-widest leading-tight">Kredit Pajak</span>
          </div>
          <p className="text-lg sm:text-xl md:text-4xl font-bold text-white tracking-tight leading-tight break-words">
            <span className="text-slate-500 text-sm md:text-2xl mr-1">Rp</span>
            {totalWithheldTax.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] md:text-sm text-slate-500 mt-2 md:mt-4 leading-snug md:leading-relaxed group-hover:text-slate-400 transition-colors">Pajak dipotong pihak lain</p>
        </div>
      </div>

    </div>
  );
}
