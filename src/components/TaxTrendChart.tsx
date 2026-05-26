'use client';

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

  const chartData = sortedYears.map((yr) => ({
    year: String(yr),
    gross: yearMap[yr].gross,
    tax: yearMap[yr].tax,
  }));

  // Jika semua data bernilai 0, kita berikan data visual simulasi sebagai panduan tren awal
  const isAllZero = chartData.every(d => d.gross === 0 && d.tax === 0);
  const displayData = isAllZero 
    ? [
        { year: '2024', gross: 120000000, tax: 6000000 },
        { year: '2025', gross: 180000000, tax: 12000000 },
        { year: '2026', gross: 240000000, tax: 21000000 }
      ]
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
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[11px] md:text-xs font-semibold">
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
                dataKey="year" 
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
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tahun Laporan</span>
                          <span className="text-xs font-black text-white font-mono">{data.year}</span>
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

      </div>
    </div>
  );
}
