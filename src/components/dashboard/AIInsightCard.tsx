'use client';

import { useDemoStore } from '@/store/useDemoStore';
import { useTaxpayerStore } from '@/store/useTaxpayerStore';
import { ReadinessResult } from '@/lib/readinessEngine';

export default function AIInsightCard({ score, missingItems }: { score?: number, missingItems?: string[] }) {
  const { isDemoMode, persona, demoScore, demoMissingItems } = useDemoStore();
  
  const currentScore = isDemoMode ? demoScore : (score || 0);
  const currentMissing = isDemoMode ? demoMissingItems : (missingItems || []);

  let insightMessage = '';
  
  if (isDemoMode && persona === 'Karyawan + Freelancer') {
    insightMessage = `Halo Karyawan & Freelancer! Kami mendeteksi Anda memiliki dua sumber penghasilan aktif. Sebaiknya segera siapkan Bukti Potong (1721-A1) dari gaji, serta Daftar Aset & Rekap Bukti Pembayaran untuk pendapatan freelance Anda agar terhindar dari denda di kemudian hari.`;
  } else if (currentScore >= 100) {
    insightMessage = "Luar biasa! Profil pajak Anda sudah lengkap. Anda siap untuk melakukan pelaporan pajak secara resmi di situs DJP.";
  } else if (currentMissing.includes('Berkas')) {
    insightMessage = `Halo ${isDemoMode && persona ? persona : 'Wajib Pajak'}! Kami mendeteksi berkas Anda belum lengkap. Sebaiknya segera siapkan Bukti Potong (1721 A1/A2) agar perhitungan lebih presisi sebelum batas waktu pelaporan.`;
  } else if (currentMissing.includes('Penghasilan')) {
    insightMessage = "Jangan lupa untuk mencatat seluruh sumber penghasilan Anda tahun ini, termasuk yang mungkin sudah dipotong pajak final, agar tidak ada denda di kemudian hari.";
  } else {
    insightMessage = "Terus lengkapi data Anda. Semakin lengkap profil pajak Anda, semakin akurat simulasi yang dapat dihasilkan oleh sistem.";
  }

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 md:p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <span className="text-6xl">🤖</span>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl shadow-lg shadow-purple-500/10">
          ✨
        </div>
        <div>
          <h3 className="font-bold text-white text-lg tracking-tight">AI Insights</h3>
          <p className="text-xs text-purple-300 font-medium">Berdasarkan profil Anda</p>
        </div>
      </div>
      
      <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-2xl relative z-10">
        {insightMessage}
      </p>
      
      <div className="mt-4 pt-4 border-t border-purple-500/20 text-[10px] text-slate-500 flex flex-col md:flex-row gap-2 justify-between">
        <p><strong>Disclaimer:</strong> Insight di atas dihasilkan oleh AI dan tidak menggantikan saran konsultan pajak resmi.</p>
        {isDemoMode && (
          <span className="text-purple-400 font-bold tracking-wider uppercase bg-purple-500/10 px-2 py-0.5 rounded">
            Generated with Demo Data
          </span>
        )}
      </div>
    </div>
  );
}
