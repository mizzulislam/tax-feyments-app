'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoStore } from '@/store/useDemoStore';

const IconBarChart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const IconBot = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
    <circle cx="12" cy="5" r="2"></circle>
    <path d="M12 7v4"></path>
    <line x1="8" y1="16" x2="8" y2="16"></line>
    <line x1="16" y1="16" x2="16" y2="16"></line>
  </svg>
);

const IconFileText = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const IconAlertCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const IconLayers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
    <polyline points="2 17 12 22 22 17"></polyline>
    <polyline points="2 12 12 17 22 12"></polyline>
  </svg>
);

const IconCalculator = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <line x1="8" y1="6" x2="16" y2="6"></line>
    <line x1="16" y1="14" x2="16" y2="18"></line>
    <path d="M16 10h.01"></path>
    <path d="M12 10h.01"></path>
    <path d="M8 10h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M8 14h.01"></path>
    <path d="M12 18h.01"></path>
    <path d="M8 18h.01"></path>
  </svg>
);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { loadDemoData } = useDemoStore();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!gridRef.current) return;
      // Get the exact physical bounds of the grid, ensuring perfect tracking even if scrolling affects fixed positioning
      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      gridRef.current.style.setProperty('--mouse-x', `${x}px`);
      gridRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 overflow-x-hidden font-sans">
      
      {/* Background Interactive Grid (z-0: Always behind the cards) */}
      <div ref={gridRef} className="pointer-events-none fixed inset-0 z-0 h-full w-full">
        {/* Base Grid (Dim) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        {/* Glowing Grid Overlay (Revealed instantly by cursor) */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f680_1px,transparent_1px),linear-gradient(to_bottom,#3b82f680_1px,transparent_1px)] bg-[size:48px_48px]"
          style={{
            maskImage: `radial-gradient(250px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent)`,
            WebkitMaskImage: `radial-gradient(250px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent)`
          }}
        />
        
        {/* Ambient Spotlight */}
        <div 
          className="absolute inset-0 mix-blend-screen"
          style={{
            background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(29, 78, 216, 0.12), transparent 80%)`
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between p-6 md:px-12 bg-transparent border-b border-white/5 sticky top-0 transition-all duration-300">
        <div className="flex items-center gap-3">
          <Image 
            src="/logos/logo-my-tax.svg" 
            alt="My Tax Logo" 
            width={120} 
            height={32} 
            className="h-8 w-auto hover:opacity-90 transition-opacity"
            priority
          />
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Masuk
          </Link>
          <Link href="/onboarding" className="relative px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all hover:scale-105 active:scale-95 group">
            <span className="absolute inset-0 rounded-full border border-blue-400/80 shadow-[0_0_15px_rgba(96,165,250,0.6)] animate-pulse pointer-events-none group-hover:shadow-[0_0_25px_rgba(96,165,250,0.8)]"></span>
            <span className="relative z-10">Mulai Checkup</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
          Pusing Lapor Pajak?<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Biar My Tax yang Siapkan.
          </span>
        </h1>

        <p className="text-sm md:text-base text-slate-400 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
          My Tax adalah asisten persiapan pajak pribadi untuk Wajib Pajak Orang Pribadi di Indonesia. Khusus dirancang bagi karyawan, freelancer, dan UMKM kecil untuk merapikan data dengan cerdas sebelum lapor ke DJP/Coretax.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
          <Link href="/onboarding" className="relative w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-base font-bold rounded-2xl transition-all transform hover:-translate-y-1 hover:scale-[1.02] group">
            <span className="absolute inset-0 rounded-2xl border border-blue-400/80 shadow-[0_0_15px_rgba(96,165,250,0.6)] animate-pulse pointer-events-none group-hover:shadow-[0_0_25px_rgba(96,165,250,0.8)]"></span>
            <span className="relative z-10">Mulai Tax Checkup</span>
          </Link>
          <div className="relative group/demobtn w-full sm:w-auto">
            <button 
              onClick={() => {
                document.cookie = "demo_mode=true; path=/; max-age=86400"; // 1 day
                loadDemoData('Karyawan + Freelancer');
                router.push('/dashboard');
              }}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-white text-base font-bold rounded-2xl transition-all shadow-lg transform hover:-translate-y-1 hover:scale-[1.02]"
            >
              Coba Data Demo
            </button>

            {/* Tooltip */}
            <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 whitespace-normal w-60 rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-slate-600 px-4 py-3 text-xs font-medium text-slate-200 opacity-0 shadow-2xl transition-all duration-300 group-hover/demobtn:opacity-100 group-hover/demobtn:translate-y-1 text-center">
              Lihat simulasi fitur secara instan menggunakan data pajak <strong>dummy</strong> tanpa perlu registrasi atau mengisi data asli.
            </div>
          </div>
        </div>

        {/* Pain Points Section */}
        <div className="w-full mt-40">
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Sering Mengalami Ini?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { icon: <IconAlertCircle />, title: 'Bingung Dokumen', desc: 'Tidak tahu pasti dokumen dan bukti potong apa saja yang wajib disiapkan sebelum mengisi SPT.', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
              { icon: <IconLayers />, title: 'Data Tersebar', desc: 'Penghasilan dari gaji, freelance, dan bisnis UMKM tercampur dan sulit direkapitulasi secara rapi.', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
              { icon: <IconCalculator />, title: 'Takut Salah Hitung', desc: 'Khawatir ada kurang bayar atau denda karena salah memahami aturan atau salah kalkulasi.', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            ].map((item, i) => (
              <div key={i} className={`p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-md border ${item.border} transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:border-slate-500/50 group`}>
                <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                  {item.icon}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${item.color}`}>{item.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Value Props Section */}
        <div className="w-full mt-24">
          <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Solusi Cerdas Kami</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { icon: <IconBarChart />, title: 'Readiness Score', desc: 'Ketahui seberapa siap data dan dokumen Anda sebelum mengisi SPT tahunan yang sebenarnya.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { icon: <IconBot />, title: 'AI Insights', desc: 'Dapatkan rekomendasi cerdas dari AI untuk mengoptimalkan persiapan pajak berdasarkan profil Anda.', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
              { icon: <IconFileText />, title: 'Export Laporan', desc: 'Unduh Tax Readiness Report PDF sebagai panduan akurat Anda saat mengisi data di e-Filing DJP.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            ].map((item, i) => (
              <div key={i} className={`p-8 rounded-[2rem] bg-slate-900/40 backdrop-blur-md border ${item.border} transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:border-slate-500/50 group`}>
                <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer / Disclaimer */}
      <footer className="relative z-10 bg-slate-950 py-12 px-6 text-center mt-40">
        {/* Fade Out Gradient for Grid at the bottom of the page */}
        <div className="absolute bottom-full left-0 w-full h-64 bg-gradient-to-b from-transparent to-slate-950 pointer-events-none"></div>
        {/* Subtle top border line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-slate-800/60 to-transparent"></div>
        
        <p className="text-xs text-slate-500 max-w-3xl mx-auto leading-relaxed relative z-10">
          <strong className="text-slate-400">Disclaimer:</strong> My Tax adalah asisten AI persiapan pajak untuk Wajib Pajak Orang Pribadi dan <strong>bukan aplikasi resmi dari Direktorat Jenderal Pajak (DJP)</strong>. 
          Aplikasi ini tidak menerbitkan kode billing resmi, tidak terafiliasi dengan Coretax, dan tidak menggantikan nasihat konsultan pajak bersertifikat. 
          Semua hasil perhitungan bersifat estimasi dan panduan.
        </p>
      </footer>
    </div>
  );
}
