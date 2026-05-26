'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryBreakdown } from '@/lib/analyticsEngine';

interface TaxBreakdownPieChartProps {
  data: CategoryBreakdown[];
}

const COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#14b8a6', // teal
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#64748b', // slate
];

export default function TaxBreakdownPieChart({ data }: TaxBreakdownPieChartProps) {
  // Cek apakah data kosong untuk menampilkan visual simulasi default
  const isEmpty = data.length === 0 || data.every((d) => d.value === 0);

  const displayData = isEmpty
    ? [
        { name: 'Gaji / Upah Karyawan', value: 120000000, taxValue: 6000000 },
        { name: 'Penjualan Toko Online / Omzet UMKM', value: 45000000, taxValue: 225000 },
        { name: 'Honorarium Pembicara / Jasa Profesional', value: 25000000, taxValue: 625000 },
        { name: 'Sewa Gedung / Kantor', value: 18000000, taxValue: 1800000 },
        { name: 'Dividen Saham', value: 15000000, taxValue: 1500000 }
      ]
    : data;

  const totalValue = displayData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="relative p-[1px] rounded-2xl md:rounded-3xl overflow-hidden group shadow-2xl h-[270px] md:h-[360px] flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/15 via-blue-500/5 to-transparent opacity-40"></div>
      
      <div className="relative flex-1 bg-slate-900/85 backdrop-blur-2xl p-4 md:p-6 rounded-[18px] md:rounded-[23px] flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <h3 className="text-sm md:text-md font-bold text-white tracking-tight">Proporsi Kategori Penghasilan</h3>
          </div>
          <p className="text-[10px] md:text-[11px] text-slate-400">
            {isEmpty ? 'Visualisasi Data Transaksi Simulasi' : 'Alokasi Nominal Keuangan Anda Berdasarkan Kategori'}
          </p>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 min-h-[165px] md:min-h-[220px]">
          {/* Donut Chart */}
          <div className="w-28 h-28 md:w-40 md:h-40 flex-shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percentage = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : 0;
                      return (
                        <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl shadow-2xl space-y-1.5 w-60 pointer-events-none">
                          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider line-clamp-1">{data.name}</p>
                          <div className="border-t border-slate-900/60 my-1"></div>
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-slate-400">Bruto:</span>
                            <span className="text-white font-mono">Rp {data.value.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-slate-400">Persentase:</span>
                            <span className="text-indigo-400 font-mono">{percentage}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="87%"
                  paddingAngle={3}
                  dataKey="value"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={1} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total</span>
              <span className="text-xs font-extrabold text-white font-mono mt-0.5">
                Rp {totalValue >= 1000000000 ? `${(totalValue / 1000000000).toFixed(1)}M` : `${(totalValue / 1000000).toFixed(0)}Jt`}
              </span>
            </div>
          </div>

          {/* Simple Legend Column */}
          <div className="flex-1 w-full max-h-[70px] md:max-h-[160px] overflow-y-auto custom-scrollbar space-y-1 md:space-y-1.5 pr-2">
            {displayData.map((item, idx) => {
              const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(0) : 0;
              return (
                <div key={idx} className="flex items-center justify-between gap-3 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    ></span>
                    <span className="text-slate-400 truncate line-clamp-1">{item.name}</span>
                  </div>
                  <span className="text-white font-mono flex-shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
