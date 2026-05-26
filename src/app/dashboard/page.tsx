'use client';

import { useFetchReports } from '@/hooks/useFetchReports';
import DashboardStats from '@/components/DashboardStats';
import TaxHistoryTable from '@/components/TaxHistoryTable';

import TaxCalendar from '@/components/TaxCalendar';
import TaxTrendChart from '@/components/TaxTrendChart';
import AdvancedAnalyticsSection from '@/components/AdvancedAnalyticsSection';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function DashboardContent() {
  const { data: reports, isLoading, isError, error } = useFetchReports();
  const searchParams = useSearchParams();
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setErrorBanner(decodeURIComponent(err));
      // Hapus query parameter dari URL agar bersih dan rapi
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-16 h-16 rounded-full bg-blue-500/20"></div>
          <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl backdrop-blur-xl">
        <h3 className="font-semibold text-lg mb-2">Gagal Memuat Data</h3>
        <p className="text-sm opacity-80">{error?.message}</p>
      </div>
    );
  }

  const reportsData = reports || [];

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-500">
      
      {/* BANNER NOTIFIKASI ERROR (ROLE GUARD LIMITATION) */}
      {errorBanner && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-sm text-red-400 rounded-2xl backdrop-blur-md flex items-center gap-3 shadow-lg shadow-red-500/5 animate-in slide-in-from-top-4 duration-300">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <span className="font-semibold">{errorBanner}</span>
        </div>
      )}

      {/* Welcome Title Banner */}
      <div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2 md:mb-3">
          Dasbor Utama
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm md:text-md leading-relaxed">
          Kelola, simulasikan, dan pantau riwayat pelaporan pajak Anda secara terintegrasi menggunakan kalkulator pintar UU HPP.
        </p>
      </div>

      {/* Core Stats Overview */}
      <DashboardStats data={reportsData} />

      {/* Visual Analytics Trend Chart */}
      <TaxTrendChart data={reportsData} />

      <AdvancedAnalyticsSection reportsData={reportsData} />

      {/* Sections: Tax History and Tax Calendar */}
      <div className="space-y-5 md:space-y-8">
        <TaxHistoryTable data={reportsData} />
        <TaxCalendar />
      </div>
      
      {/* Floating Chat Assistant */}


    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
