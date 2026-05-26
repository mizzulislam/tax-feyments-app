'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { YearlyAggregate } from '@/lib/analyticsEngine';

interface YearComparisonChartProps {
  data: YearlyAggregate[];
}

export default function YearComparisonChart({ data }: YearComparisonChartProps) {
  // Cek apakah data kosong untuk menampilkan visual simulasi default
  const isEmpty = data.every((d) => d.gross === 0 && d.tax === 0);

  const displayData = isEmpty
    ? [
        { year: 2024, gross: 120000000, tax: 6000000 },
        { year: 2025, gross: 180000000, tax: 12000000 },
        { year: 2026, gross: 240000000, tax: 21000000 }
      ]
    : data;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(0)}jt`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="relative p-[1px] rounded-2xl md:rounded-3xl overflow-hidden group shadow-2xl h-[250px] md:h-[360px] flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 via-indigo-500/5 to-transparent opacity-40"></div>
      
      <div className="relative flex-1 bg-slate-900/85 backdrop-blur-2xl p-4 md:p-6 rounded-[18px] md:rounded-[23px] flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <h3 className="text-sm md:text-md font-bold text-white tracking-tight">Komparasi Pajak YoY</h3>
              </div>
              <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">
                {isEmpty ? 'Visualisasi Data Tahunan Simulasi' : 'Perbandingan Side-by-Side Pendapatan vs Pajak per Tahun'}
              </p>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-3 md:gap-4 text-[10px] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                <span className="text-slate-400">Bruto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                <span className="text-slate-400">PPh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 w-full h-full min-h-[150px] md:min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorYoYGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="colorYoYTax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#be123c" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/40" vertical={false} />
              <XAxis 
                dataKey="year" 
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
                        <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Tahun Pajak {data.year}</p>
                        <div className="border-t border-slate-900/60 my-1"></div>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-400">Bruto:</span>
                          <span className="text-blue-400 font-mono">Rp {data.gross.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-400">PPh:</span>
                          <span className="text-rose-400 font-mono">Rp {data.tax.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="gross" 
                fill="url(#colorYoYGross)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={24}
              />
              <Bar 
                dataKey="tax" 
                fill="url(#colorYoYTax)" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
