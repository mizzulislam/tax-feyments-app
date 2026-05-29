import React from 'react';

export default function AIResponseWrapper({ children, isHighRisk }: { children: React.ReactNode, isHighRisk?: boolean }) {
  return (
    <div className="relative">
      {/* Watermark Edukasi */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl flex items-center justify-center opacity-[0.03] select-none z-0">
        <div className="transform -rotate-12 whitespace-nowrap text-2xl font-black text-white">
          AI GENERATED • MY TAX
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Footer Disclaimer */}
      <div className={`mt-3 pt-3 border-t text-[9px] sm:text-[10px] leading-relaxed italic ${isHighRisk ? 'border-red-500/20 text-red-300' : 'border-slate-700/50 text-slate-400'}`}>
        {isHighRisk ? (
          <span className="flex items-start gap-1.5">
            <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Tanggapan ini menyinggung topik hukum/pajak berisiko tinggi. Gunakan sebagai wawasan awal, bukan substitusi opini tenaga profesional resmi.
          </span>
        ) : (
          "Tanggapan AI mungkin tidak 100% akurat. Selalu verifikasi ulang dengan konsultan pajak sebelum mengambil keputusan fiskal."
        )}
      </div>
    </div>
  );
}
