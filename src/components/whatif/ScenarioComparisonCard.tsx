'use client';

interface ScenarioComparisonCardProps {
  baseTaxResult: number;
  simTaxResult: number;
  taxDifference: number;
  savingsPercentage: number;
}

export default function ScenarioComparisonCard({
  baseTaxResult,
  simTaxResult,
  taxDifference,
  savingsPercentage,
}: ScenarioComparisonCardProps) {
  
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isSaving = taxDifference > 0;
  const isLosing = taxDifference < 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 relative overflow-hidden">
      {/* Decorative gradient */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000 ${isSaving ? 'bg-emerald-500' : isLosing ? 'bg-red-500' : 'bg-blue-500'}`}></div>

      <div>
        <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Tax Optimization Advisor
        </h3>
        <p className="text-sm text-slate-400 mt-1">Perbandingan skenario pajak dan rekomendasi efisiensi secara real-time.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Base Condition */}
        <div className="bg-slate-950/50 rounded-2xl p-5 border border-slate-800/80">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kondisi Awal</p>
          <p className="text-xl font-black text-slate-300 tracking-tight font-mono break-words">
            {formatIDR(baseTaxResult)}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Pajak Terutang</p>
        </div>

        {/* Simulation Condition */}
        <div className={`bg-slate-950/50 rounded-2xl p-5 border ${isSaving ? 'border-emerald-500/30 bg-emerald-500/5' : isLosing ? 'border-red-500/30 bg-red-500/5' : 'border-blue-500/30 bg-blue-500/5'}`}>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Skenario Baru</p>
          <p className={`text-xl font-black tracking-tight font-mono break-words ${isSaving ? 'text-emerald-400' : isLosing ? 'text-red-400' : 'text-blue-400'}`}>
            {formatIDR(simTaxResult)}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Estimasi Terutang</p>
        </div>
      </div>

      {/* Difference Highlights */}
      <div className="pt-6 border-t border-slate-800/80 space-y-5 relative z-10">
        <h4 className="text-sm font-bold text-white mb-4">Dampak Finansial</h4>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400 font-medium">Selisih Nominal Pajak</span>
          <span className={`text-lg font-bold font-mono ${isSaving ? 'text-emerald-400' : isLosing ? 'text-red-400' : 'text-slate-300'}`}>
            {isSaving ? '-' : isLosing ? '+' : ''}{formatIDR(Math.abs(taxDifference))}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400 font-medium">Persentase Perubahan</span>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold ${isSaving ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : isLosing ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            {isSaving ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17V7m0 0l-4 4m4-4l4 4"></path></svg>
            ) : isLosing ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7v10m0 0l4-4m-4 4l-4-4"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
            )}
            {Math.abs(savingsPercentage).toFixed(2)}% {isSaving ? 'Hemat' : isLosing ? 'Naik' : 'Tetap'}
          </div>
        </div>
      </div>

      {isSaving && (
        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3">
          <svg className="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-400">Peluang Efisiensi Ditemukan!</p>
            <p className="text-xs text-emerald-400/80 mt-1 leading-relaxed">Skenario ini lebih efisien secara fiskal. Rekomendasi aksi:</p>
            <ul className="mt-2 text-[11px] text-emerald-400/70 list-disc pl-4 space-y-1">
              <li>Konsultasikan perubahan struktur gaji/benefit dengan HR.</li>
              <li>Simpan perhitungan ini sebagai referensi perencanaan tahun depan.</li>
              <li>Pastikan seluruh tunjangan memenuhi syarat bebas pajak (Natura/Kenikmatan).</li>
            </ul>
          </div>
        </div>
      )}

      {isLosing && (
        <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3">
          <svg className="w-6 h-6 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div className="flex-1">
            <p className="text-sm font-bold text-orange-400">Peringatan: Beban Pajak Meningkat</p>
            <p className="text-xs text-orange-400/80 mt-1 leading-relaxed">Skenario ini akan meningkatkan liabilitas pajak Anda. Pertimbangan:</p>
            <ul className="mt-2 text-[11px] text-orange-400/70 list-disc pl-4 space-y-1">
              <li>Tinjau kembali pemotongan PTKP atau skema tunjangan (Gross vs Gross-up).</li>
              <li>Manfaatkan fasilitas PPh yang tersedia sesuai regulasi terbaru.</li>
              <li>Konsultasikan dengan konsultan pajak melalui menu AI Assistant.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
