'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TAX_EDUCATION_SLIDES = [
  {
    category: 'Kepatuhan Pajak (Tax Compliance)',
    title: 'Pilar Utama Pembangunan Negara',
    stat: '70%+',
    statLabel: 'Sumber Penerimaan APBN',
    desc: 'Lebih dari 70% penerimaan APBN Indonesia bersumber dari sektor perpajakan. Setiap rupiah pajak yang Anda laporkan mendanai kemandirian pembangunan dan kedaulatan ekonomi nasional.',
  },
  {
    category: 'Kesadaran Pajak (Tax Awareness)',
    title: 'Gotong Royong untuk Fasilitas Publik',
    stat: '270M+',
    statLabel: 'Masyarakat Menikmati Fasilitas',
    desc: 'Pajak Anda diubah menjadi jaminan kesehatan (BPJS), subsidi energi, perbaikan sarana jalan, beasiswa pendidikan berkualitas (LPDP), hingga penguatan sarana transportasi massal.',
  },
  {
    category: 'Tax Ratio Indonesia',
    title: 'Reformasi untuk Masa Depan Bangsa',
    stat: '10.4%',
    statLabel: 'Rasio Pajak Nasional Terkini',
    desc: 'Melalui implementasi UU HPP dan sistem perpajakan digital Coretax terbaru, pemerintah menargetkan optimalisasi rasio pajak demi mewujudkan kemandirian ekonomi Indonesia Emas 2045.',
  },
  {
    category: 'Informasi Menarik (Tax Fact)',
    title: 'Pembebasan Pajak Khusus UMKM',
    stat: 'Rp 500 Juta',
    statLabel: 'Batas Omzet Bebas Pajak',
    desc: 'Khusus bagi Wajib Pajak Orang Pribadi pelaku UMKM, negara membebaskan PPh atas peredaran bruto (omzet) usaha hingga Rp 500 Juta setahun sebagai bentuk dukungan penuh bagi pertumbuhan ekonomi rakyat.',
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Interval Carousel Edukasi (Berganti setiap 7 detik)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TAX_EDUCATION_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-950 relative overflow-hidden font-sans">
      
      {/* 1. BAGIAN KIRI: PANEL EDUKASI & FAKTA PERPAJAKAN (HIDDEN DI MOBILE) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 xl:p-20 overflow-hidden bg-slate-900/30 border-r border-slate-900">
        {/* Glowing Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        {/* Brand Logo di pojok kiri atas */}
        <div className="absolute top-10 left-10 flex items-center select-none">
          <img src="/logos/logo-my-tax.svg" alt="My Tax Logo" className="h-8 w-auto object-contain" />
        </div>

        {/* Carousel Content */}
        <div className="relative max-w-lg w-full space-y-8 z-10">
          
          {/* Slide Box (Keyed dynamically to re-trigger CSS animations on change) */}
          <div 
            key={currentSlide} 
            className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:-translate-y-1 transition-all"
          >
            
            {/* Category Badge */}
            <span className="inline-flex px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              {TAX_EDUCATION_SLIDES[currentSlide].category}
            </span>

            {/* Title */}
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              {TAX_EDUCATION_SLIDES[currentSlide].title}
            </h2>

            {/* Giant Stat Callout (Struktur Flex-Col/Row Responsif Tanpa Wrap) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 py-2.5">
              <span className="text-5xl xl:text-6xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-indigo-300 bg-clip-text text-transparent font-mono whitespace-nowrap tracking-tight">
                {TAX_EDUCATION_SLIDES[currentSlide].stat}
              </span>
              <div className="hidden sm:block h-10 w-px bg-slate-800"></div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-snug">
                {TAX_EDUCATION_SLIDES[currentSlide].statLabel}
              </span>
            </div>

            {/* Description */}
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              {TAX_EDUCATION_SLIDES[currentSlide].desc}
            </p>
          </div>

          {/* Carousel Indicators */}
          <div className="flex items-center gap-2.5 pt-4">
            {TAX_EDUCATION_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${index === currentSlide ? 'w-8 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'w-2 bg-slate-800 hover:bg-slate-700'}`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>

        </div>

      </div>

      {/* 2. BAGIAN KANAN: FORM LOGIN UTAMA (TANPA BORDER) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-slate-950">
        {/* Background glowing blob for mobile */}
        <div className="absolute inset-0 bg-blue-600/5 blur-[80px] pointer-events-none lg:hidden"></div>

        {/* Login Box (Tanpa border untuk tampilan tanpa batas yang sangat mewah) */}
        <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative z-10 border-0">
          
          <div className="text-center mb-8">
            {/* Logo untuk mobile view */}
            <div className="flex items-center justify-center mx-auto mb-6 lg:hidden">
              <img src="/logos/logo-my-tax.svg" alt="My Tax Logo" className="h-10 w-auto object-contain" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Selamat Datang</h1>
            <p className="text-slate-400 text-sm">Masuk untuk mengelola data pajak Anda.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-medium font-mono"
                placeholder="nama@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-medium font-mono"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold rounded-xl px-4 py-3.5 hover:bg-blue-500 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 text-xs uppercase tracking-wider font-semibold cursor-pointer"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="h-px bg-slate-850 flex-1"></div>
            <span className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase">ATAU</span>
            <div className="h-px bg-slate-850 flex-1"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="mt-6 w-full bg-white text-slate-900 font-bold rounded-xl px-4 py-3.5 hover:bg-gray-100 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-wider cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Masuk dengan Google
          </button>

          <p className="mt-8 text-center text-xs text-slate-400 font-medium">
            Belum punya akun?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-extrabold transition-colors">
              Daftar Sekarang
            </Link>
          </p>
        </div>

      </div>

    </div>
  );
}
