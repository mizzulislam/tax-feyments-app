'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MonthlyAggregate } from '@/lib/analyticsEngine';

interface MonthlyTrendBarChartProps {
  data: MonthlyAggregate[];
}

export default function MonthlyTrendBarChart({ data }: MonthlyTrendBarChartProps) {
  // Cek apakah data kosong untuk menampilkan visual simulasi default
  const isEmpty = data.every((d) => d.gross === 0);

  const displayData = isEmpty
    ? [
        { month: 'Jan 2026', gross: 15000000 },
        { month: 'Feb 2026', gross: 18000000 },
        { month: 'Mar 2026', gross: 16500000 },
        { month: 'Apr 2026', gross: 22000000 },
        { month: 'Mei 2026', gross: 25000000 },
        { month: 'Jun 2026', gross: 24000000 },
        { month: 'Jul 2026', gross: 28000000 },
        { month: 'Agu 2026', gross: 30000000 },
        { month: 'Sep 2026', gross: 27500000 },
        { month: 'Okt 2026', gross: 32000000 },
        { month: 'Nov 2026', gross: 35000000 },
        { month: 'Des 2026', gross: 42000000 }
      ]
    : data;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="relative p-[1px] rounded-2xl md:rounded-3xl overflow-hidden group shadow-2xl h-[250px] md:h-[360px] flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 via-blue-500/5 to-transparent opacity-40"></div>
      
      <div className="relative flex-1 bg-slate-900/85 backdrop-blur-2xl p-4 md:p-6 rounded-[18px] md:rounded-[23px] flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-550 bg-emerald-450 bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm md:text-md font-bold text-white tracking-tight">Tren Penghasilan Bruto</h3>
          </div>
          <p className="text-[10px] md:text-[11px] text-slate-400">
            {isEmpty ? 'Visualisasi Data Tren Bulanan Simulasi' : 'Statistik Fluktuasi Penghasilan Kotor Bulanan Wajib Pajak'}
          </p>
        </div>

        {/* Chart Container */}
        <div className="flex-1 w-full h-full min-h-[150px] md:min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBarGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/40" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                fontSize={9} 
                fontWeight="bold" 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={9} 
                fontWeight="bold" 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={formatCurrency}
              />
              <Tooltip
                cursor={{ fill: '#334155', opacity: 0.15, radius: 4 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl shadow-2xl space-y-1.5 w-52 pointer-events-none">
                        <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{data.month}</p>
                        <div className="border-t border-slate-900/60 my-1"></div>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-400">Total Bruto:</span>
                          <span className="text-emerald-400 font-mono">Rp {data.gross.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="gross" 
                fill="url(#colorBarGross)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
