'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Registrasi Berhasil!</h2>
          <p className="text-slate-400 text-sm mb-6">Jika sistem memerlukan verifikasi, silakan periksa kotak masuk email Anda. Jika tidak, Anda dapat langsung login.</p>
          <Link href="/login" className="inline-block w-full bg-blue-600 text-white font-bold rounded-xl px-4 py-3 hover:bg-blue-500 transition-all">
            Ke Halaman Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Buat Akun</h1>
          <p className="text-slate-400 text-sm">Daftar untuk mulai mengelola pajak Anda.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
              placeholder="nama@email.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold rounded-xl px-4 py-3.5 hover:bg-blue-500 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:hover:shadow-none"
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span className="text-xs text-slate-500 font-medium">ATAU</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="mt-6 w-full bg-white text-slate-900 font-bold rounded-xl px-4 py-3.5 hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Daftar dengan Google
        </button>

        <p className="mt-8 text-center text-sm text-slate-400">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
