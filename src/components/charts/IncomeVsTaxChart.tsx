'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MonthlyAggregate } from '@/lib/analyticsEngine';

interface IncomeVsTaxChartProps {
  data: MonthlyAggregate[];
}

export default function IncomeVsTaxChart({ data }: IncomeVsTaxChartProps) {
  // Cek apakah data kosong untuk menampilkan visual simulasi default
  const isEmpty = data.every((d) => d.gross === 0 && d.tax === 0);
  
  const displayData = isEmpty
    ? [
        { month: 'Jan 2026', gross: 15000000, tax: 750000 },
        { month: 'Feb 2026', gross: 18000000, tax: 900000 },
        { month: 'Mar 2026', gross: 16500000, tax: 825000 },
        { month: 'Apr 2026', gross: 22000000, tax: 1400000 },
        { month: 'Mei 2026', gross: 25000000, tax: 1850000 },
        { month: 'Jun 2026', gross: 24000000, tax: 1720000 },
        { month: 'Jul 2026', gross: 28000000, tax: 2300000 },
        { month: 'Agu 2026', gross: 30000000, tax: 2600000 },
        { month: 'Sep 2026', gross: 27500000, tax: 2225000 },
        { month: 'Okt 2026', gross: 32000000, tax: 3100000 },
        { month: 'Nov 2026', gross: 35000000, tax: 3800000 },
        { month: 'Des 2026', gross: 42000000, tax: 5400000 }
      ]
    : data;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <div className="relative p-[1px] rounded-2xl md:rounded-3xl overflow-hidden group shadow-2xl h-[260px] md:h-[360px] flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/15 via-indigo-500/5 to-transparent opacity-40"></div>
      
      <div className="relative flex-1 bg-slate-900/85 backdrop-blur-2xl p-4 md:p-6 rounded-[18px] md:rounded-[23px] flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <h3 className="text-sm md:text-md font-bold text-white tracking-tight">Perbandingan Bruto & Pajak</h3>
              </div>
              <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">
                {isEmpty ? 'Visualisasi Data Simulasi Bulanan' : 'Perbandingan Komparatif Pendapatan vs PPh Terutang'}
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
                <span className="text-slate-400">PPh Terutang</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="flex-1 w-full h-full min-h-[145px] md:min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
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
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl shadow-2xl space-y-1.5 w-52 pointer-events-none">
                        <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">{data.month}</p>
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
              <Area 
                type="monotone" 
                dataKey="gross" 
                stroke="#3b82f6" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorGross)" 
              />
              <Area 
                type="monotone" 
                dataKey="tax" 
                stroke="#f43f5e" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorTax)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
