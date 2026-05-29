'use client';

import { useRouter } from 'next/navigation';
import { useDemoStore } from '@/store/useDemoStore';

export default function DemoCompletionModal({ isOpen }: { isOpen: boolean }) {
  const router = useRouter();
  const clearDemoMode = useDemoStore((state) => state.clearDemoMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          
          <h2 className="text-2xl font-black text-white mb-3">Simulasi Selesai!</h2>
          
          <p className="text-slate-300 text-sm leading-relaxed mb-8">
            Selamat! Anda telah berhasil melengkapi seluruh kebutuhan profil kepatuhan pajak Anda dan mencapai <strong>Skor 100%</strong> di mode simulasi ini. 
            Apakah Anda siap untuk mulai mengelola pajak sungguhan?
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => {
                document.cookie = "demo_mode=; path=/; max-age=0";
                clearDemoMode();
                router.push('/login');
              }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
            >
              Daftar Akun Sekarang
            </button>
            <button
              onClick={() => {
                document.cookie = "demo_mode=; path=/; max-age=0";
                clearDemoMode();
                router.refresh();
              }}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
            >
              Tutup & Keluar Simulasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
