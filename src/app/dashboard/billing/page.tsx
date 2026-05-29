'use client';

import React from 'react';

export default function BillingPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
          Draft Pembayaran & Panduan e-Billing
        </h1>
        <p className="text-slate-400 max-w-2xl text-md leading-relaxed font-medium">
          Siapkan data pembayaran sebagai draft internal, lalu buat kode billing dan bayar pajak hanya melalui sistem resmi Direktorat Jenderal Pajak (DJP).
        </p>
      </div>

      <div className="bg-slate-900/60 border border-blue-500/30 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <svg className="w-16 h-16 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        <h2 className="text-2xl font-bold text-slate-300">Modul Draft Pembayaran sedang dikembangkan</h2>
        <p className="text-slate-500 max-w-lg">
          Fitur ini akan segera hadir. Untuk sementara, panduan e-Billing telah dipindahkan ke menu Edukasi Perpajakan di Modul Coretax.
        </p>
      </div>
    </div>
  );
}
