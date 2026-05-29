'use client';

import { useFetchReports } from '@/hooks/useFetchReports';
import { useFetchIncomeSources } from '@/hooks/useIncomeSources';
import DashboardStats from '@/components/DashboardStats';
import ReadinessPanel from '@/components/dashboard/ReadinessPanel';
import TaxHistoryTable from '@/components/TaxHistoryTable';

import TaxCalendar from '@/components/TaxCalendar';
import TaxTrendChart from '@/components/TaxTrendChart';
import AdvancedAnalyticsSection from '@/components/AdvancedAnalyticsSection';
import AIInsightCard from '@/components/dashboard/AIInsightCard';
import ExportReportButton from '@/components/dashboard/ExportReportButton';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useDemoStore } from '@/store/useDemoStore';
import { IncomeSource } from '@/types/taxpayer';

type TabType = 'overview' | 'analytics' | 'history' | 'calendar';

function DashboardContent() {
  const { data: reports, isLoading, isError, error } = useFetchReports();
  const { data: incomeSources } = useFetchIncomeSources();
  const searchParams = useSearchParams();
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const { isDemoMode } = useDemoStore();

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setErrorBanner(decodeURIComponent(err));
      // Hapus query parameter dari URL agar bersih dan rapi
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  if (isLoading && !isDemoMode) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-16 h-16 rounded-full bg-blue-500/20"></div>
          <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (isError && !isDemoMode) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl backdrop-blur-xl">
        <h3 className="font-semibold text-lg mb-2">Gagal Memuat Data</h3>
        <p className="text-sm opacity-80">{error?.message}</p>
      </div>
    );
  }

  const reportsData = reports || [];
  const incomeData = (incomeSources || []) as IncomeSource[];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 relative">
      
      {/* BANNER NOTIFIKASI ERROR (ROLE GUARD LIMITATION) */}
      {errorBanner && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-sm text-red-400 rounded-2xl backdrop-blur-md flex items-center gap-3 shadow-lg shadow-red-500/5 animate-in slide-in-from-top-4 duration-300">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <span className="font-semibold">{errorBanner}</span>
        </div>
      )}

      {/* Welcome Title Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2 md:mb-3">
            Dasbor Utama
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm md:text-md leading-relaxed">
            Kelola, simulasikan, dan pantau riwayat pelaporan pajak Anda secara terintegrasi menggunakan kalkulator pintar UU HPP.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: 'overview', label: 'Ringkasan' },
          { id: 'analytics', label: 'Analitik' },
          { id: 'history', label: 'Riwayat Penghasilan' },
          { id: 'calendar', label: 'Kalender Pajak' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="mt-4 animate-in fade-in zoom-in-95 duration-300">
        {activeTab === 'overview' && (
          <div className="space-y-6 md:space-y-8">
            <ReadinessPanel reports={reportsData} />
            <DashboardStats data={reportsData} />
            <TaxTrendChart data={reportsData} />
            <TaxHistoryTable 
              data={incomeData.slice(0, 3)} 
              variant="compact" 
              onViewAll={() => setActiveTab('history')} 
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AdvancedAnalyticsSection reportsData={reportsData} />
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <TaxHistoryTable data={incomeData} />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <TaxCalendar />
          </div>
        )}
      </div>

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

