'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  aggregateByMonth,
  aggregateByYear,
  breakdownByCategory,
  calculateEffectiveRate,
  compareYearOverYear,
  Transaction
} from '@/lib/analyticsEngine';
import IncomeVsTaxChart from '@/components/charts/IncomeVsTaxChart';
import TaxBreakdownPieChart from '@/components/charts/TaxBreakdownPieChart';
import MonthlyTrendBarChart from '@/components/charts/MonthlyTrendBarChart';
import EffectiveRateGauge from '@/components/charts/EffectiveRateGauge';
import YearComparisonChart from '@/components/charts/YearComparisonChart';
import { TaxReportData } from '@/hooks/useFetchReports';

interface AdvancedAnalyticsSectionProps {
  reportsData: TaxReportData[];
}

function useFetchTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ['transactions_list_analytics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        if (error.message.includes('Could not find the table') || error.code === 'P0001') {
          return [];
        }
        throw new Error(error.message);
      }

      return data || [];
    },
  });
}

export default function AdvancedAnalyticsSection({ reportsData }: AdvancedAnalyticsSectionProps) {
  const { data: transactions, isLoading, isError } = useFetchTransactions();

  if (isLoading) {
    return (
      <section className="flex items-center justify-center py-16">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-14 h-14 rounded-full bg-blue-500/20"></div>
          <div className="w-7 h-7 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl backdrop-blur-xl">
        <h3 className="font-semibold text-lg mb-2">Gagal Memuat Analitik</h3>
        <p className="text-sm opacity-80">Terjadi kesalahan saat memproses data visualisasi Anda.</p>
      </section>
    );
  }

  const transactionsData = transactions || [];
  const monthlyData = aggregateByMonth(reportsData);
  const yearlyData = aggregateByYear(reportsData);
  const categoryData = breakdownByCategory(transactionsData);
  const totalGross = reportsData.reduce((sum, r) => sum + r.gross_income, 0);
  const totalTax = reportsData.reduce((sum, r) => sum + r.tax_payable, 0);
  const ETR = calculateEffectiveRate(totalGross, totalTax);
  const currentYearVal = new Date().getFullYear();
  const currentYearData = yearlyData.find(y => y.year === currentYearVal) || { year: currentYearVal, gross: 0, tax: 0 };
  const prevYearData = yearlyData.find(y => y.year === currentYearVal - 1) || { year: currentYearVal - 1, gross: 0, tax: 0 };
  const yoyComp = compareYearOverYear(currentYearData, prevYearData);

  return (
    <section className="space-y-5 md:space-y-8">
      <div>
        <h2 className="text-xl md:text-3xl font-black tracking-tight text-white mb-1.5 md:mb-2">
          Analitik <span className="text-blue-500">Lanjutan</span>
        </h2>
        <p className="text-slate-400 max-w-2xl text-xs md:text-base leading-relaxed">
          Pantau rasio pajak efektif, tren bruto bulanan, proporsi alokasi pengeluaran kotor, serta perbandingan year-over-year secara dinamis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-start">
        <div className="lg:col-span-2">
          <IncomeVsTaxChart data={monthlyData} />
        </div>
        <div className="lg:col-span-1">
          <EffectiveRateGauge rate={ETR} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <MonthlyTrendBarChart data={monthlyData} />
        <TaxBreakdownPieChart data={categoryData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
        <div className="lg:col-span-2">
          <YearComparisonChart data={yearlyData} />
        </div>

        <div className="lg:col-span-1 relative p-[1px] rounded-2xl md:rounded-3xl overflow-hidden group shadow-2xl flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent opacity-40"></div>

          <div className="relative flex-1 bg-slate-900/85 backdrop-blur-2xl p-4 md:p-6 rounded-[18px] md:rounded-[23px] flex flex-col justify-between space-y-4 md:space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <h3 className="text-sm md:text-md font-bold text-white tracking-tight">Rangkuman Kinerja YoY</h3>
              </div>
              <p className="text-[10px] md:text-[11px] text-slate-400">
                Analisis pertumbuhan finansial tahun {currentYearVal} dibandingkan tahun {currentYearVal - 1}
              </p>
            </div>

            <div className="space-y-3 md:space-y-4 flex-1 flex flex-col justify-center">
              <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Perubahan Pendapatan</span>
                <div className="flex justify-between items-center">
                  <span className="text-md font-extrabold text-white">
                    {yoyComp.grossDiff >= 0 ? '+' : ''} Rp {yoyComp.grossDiff.toLocaleString('id-ID')}
                  </span>
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${yoyComp.grossDiff >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {yoyComp.grossDiff >= 0 ? 'Naik' : 'Turun'} {Math.abs(yoyComp.grossDiffPct)}%
                  </span>
                </div>
              </div>

              <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-950/40 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Perubahan Beban PPh</span>
                <div className="flex justify-between items-center">
                  <span className="text-md font-extrabold text-white">
                    {yoyComp.taxDiff >= 0 ? '+' : ''} Rp {yoyComp.taxDiff.toLocaleString('id-ID')}
                  </span>
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${yoyComp.taxDiff >= 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {yoyComp.taxDiff >= 0 ? 'Naik' : 'Turun'} {Math.abs(yoyComp.taxDiffPct)}%
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed text-center">
              * YoY otomatis dihitung berdasarkan riwayat pelaporan formal yang disubmit ke database Anda.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
