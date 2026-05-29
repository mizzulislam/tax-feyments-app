'use client';

import { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Report {
  id: string;
  tax_year: number;
  tax_period: string;
  gross_income: number;
  tax_payable: number;
  status: string;
  created_at: string;
}

interface TaxTrendChartProps {
  data: Report[];
}

export default function TaxTrendChart({ data }: TaxTrendChartProps) {
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');

  let chartData: Array<{ label: string; gross: number; tax: number }> = [];

  if (viewMode === 'yearly') {
    // 1. Agregasi data per tahun
    const yearMap: Record<number, { gross: number; tax: number }> = {};
    
    // Mengisi default data agar chart tetap tampil cantik meskipun user baru memiliki 1-2 data
    const defaultYears = [2024, 2025, 2026];
    defaultYears.forEach(y => {
      yearMap[y] = { gross: 0, tax: 0 };
    });

    data.forEach((r) => {
      const yr = Number(r.tax_year);
      if (!isNaN(yr)) {
        if (!yearMap[yr]) {
          yearMap[yr] = { gross: 0, tax: 0 };
        }
        yearMap[yr].gross += r.gross_income;
        yearMap[yr].tax += r.tax_payable;
      }
    });

    // Urutkan tahun secara kronologis
    const sortedYears = Object.keys(yearMap)
      .map(Number)
      .sort((a, b) => a - b);

    chartData = sortedYears.map((yr) => ({
      label: String(yr),
      gross: yearMap[yr].gross,
      tax: yearMap[yr].tax,
    }));
  } else {
    // 2. Agregasi data per bulan
    const monthMap: Record<string, { gross: number; tax: number }> = {};
    
    let maxYear = new Date().getFullYear();
    if (data.length > 0) {
      const years = data.map(r => Number(r.tax_year)).filter(y => !isNaN(y));
      if (years.length > 0) {
        maxYear = Math.max(...years);
      }
    }

    // Inisialisasi 12 bulan penuh untuk tahun terakhir agar garis tren selalu terbentuk
    for (let i = 1; i <= 12; i++) {
      const key = `${maxYear}-${String(i).padStart(2, '0')}`;
      monthMap[key] = { gross: 0, tax: 0 };
    }

    data.forEach((r) => {
      const yr = Number(r.tax_year);
      const mo = r.tax_period;
      // Filter data bulanan hanya untuk tahun terakhir (maxYear)
      if (yr === maxYear && !isNaN(yr) && mo) {
        const key = `${yr}-${mo.padStart(2, '0')}`;
        if (monthMap[key]) {
          monthMap[key].gross += r.gross_income;
          monthMap[key].tax += r.tax_payable;
        }
      }
    });

    const sortedMonths = Object.keys(monthMap).sort((a, b) => a.localeCompare(b));
    chartData = sortedMonths.map((key) => {
       const [yr, mo] = key.split('-');
       const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
       const monthLabel = monthNames[parseInt(mo, 10) - 1] || mo;
       return {
         label: `${monthLabel} ${yr}`,
         gross: monthMap[key].gross,
         tax: monthMap[key].tax,
       };
    });
  }

  // Jika semua data bernilai 0, kita berikan data visual simulasi sebagai panduan tren awal
  const isAllZero = chartData.every(d => d.gross === 0 && d.tax === 0);
  const displayData = isAllZero 
    ? (viewMode === 'yearly'
      ? [
          { label: '2024', gross: 120000000, tax: 6000000 },
          { label: '2025', gross: 180000000, tax: 12000000 },
          { label: '2026', gross: 240000000, tax: 21000000 }
        ]
      : [
          { label: 'Jan 2026', gross: 10000000, tax: 500000 },
          { label: 'Feb 2026', gross: 12000000, tax: 600000 },
          { label: 'Mar 2026', gross: 15000000, tax: 750000 },
          { label: 'Apr 2026', gross: 15000000, tax: 750000 },
          { label: 'Mei 2026', gross: 20000000, tax: 1000000 }
        ])
    : chartData;

  const formatCurrency = (val: number) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)}M`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(0)}jt`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="relative p-[1px] rounded-2xl md:rounded-3xl overflow-hidden group shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-indigo-500/5 to-transparent opacity-50"></div>
      
      <div className="relative bg-slate-900/85 backdrop-blur-2xl p-4 md:p-8 rounded-[18px] md:rounded-[23px] space-y-4 md:space-y-6">
        
        {/* Header Grafik */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <h3 className="text-base md:text-lg font-bold text-white tracking-tight">Tren Analisis Perpajakan</h3>
            </div>
            <p className="text-[11px] md:text-xs text-slate-400 mt-1">
              {isAllZero ? 'Visualisasi Data Simulasi Wajib Pajak OP' : 'Perbandingan Komparatif Riwayat Pajak Anda'}
            </p>
          </div>

          {/* Legenda Grafik */}
          <div className="flex flex-wrap items-center justify-end gap-3 md:gap-4 text-[11px] md:text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
              <span className="text-slate-300">Pendapatan Bruto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
              <span className="text-slate-300">PPh Terutang</span>
            </div>
          </div>
        </div>

        {/* CONTAINER RECHARTS */}
        <div className="w-full h-[190px] min-h-[180px] md:h-[280px] md:min-h-[240px] pt-2 md:pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="trendTax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.4} vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight="bold" 
                fontFamily="inherit"
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight="bold" 
                fontFamily="inherit"
                tickLine={false} 
                axisLine={false} 
                tickFormatter={formatCurrency}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-4.5 rounded-2xl shadow-xl space-y-2.5 w-60 pointer-events-none">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{viewMode === 'yearly' ? 'Tahun Laporan' : 'Bulan Laporan'}</span>
                          <span className="text-xs font-black text-white font-mono">{data.label}</span>
                        </div>
                        <div className="space-y-1.5 text-xs font-semibold">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Bruto:</span>
                            <span className="text-blue-400 font-mono">Rp {data.gross.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">PPh:</span>
                            <span className="text-rose-400 font-mono">Rp {data.tax.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="gross" 
                stroke="#3b82f6" 
                strokeWidth={3.5}
                fillOpacity={1} 
                fill="url(#trendGross)" 
              />
              <Area 
                type="monotone" 
                dataKey="tax" 
                stroke="#f43f5e" 
                strokeWidth={3.5}
                fillOpacity={1} 
                fill="url(#trendTax)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Toggle View Mode at Bottom Right */}
        <div className="flex justify-end pt-2">
          <div className="flex items-center bg-slate-950/50 rounded-lg p-1 border border-slate-800/50">
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${viewMode === 'yearly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              Tahunan
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${viewMode === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              Bulanan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
