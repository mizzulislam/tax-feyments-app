'use client';

import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface EffectiveRateGaugeProps {
  rate: number;
}

export default function EffectiveRateGauge({ rate }: EffectiveRateGaugeProps) {
  // Batasi tarif maksimum progresif UU HPP yaitu 35%
  const maxRate = 35;
  const clampedRate = Math.min(Math.max(rate, 0), maxRate);
  
  // Data untuk semi-circle speedometer
  const chartData = [
    { name: 'Tarif Efektif', value: clampedRate },
    { name: 'Sisa Batas Atas', value: maxRate - clampedRate },
  ];

  // Warna gradasi: Biru ke Rose seiring tarif naik
  const getGaugeColor = (val: number) => {
    if (val <= 5) return '#3b82f6'; // 5% (biru)
    if (val <= 15) return '#6366f1'; // 15% (indigo)
    if (val <= 25) return '#f59e0b'; // 25% (kuning emas)
    return '#f43f5e'; // 30%-35% (rose)
  };

  const activeColor = getGaugeColor(clampedRate);

  return (
    <div className="relative p-[1px] rounded-2xl md:rounded-3xl overflow-hidden group shadow-2xl h-[250px] md:h-[360px] flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent opacity-40"></div>
      
      <div className="relative flex-1 bg-slate-900/85 backdrop-blur-2xl p-4 md:p-6 rounded-[18px] md:rounded-[23px] flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
            <h3 className="text-sm md:text-md font-bold text-white tracking-tight">Tarif Efektif Rata-Rata</h3>
          </div>
          <p className="text-[10px] md:text-[11px] text-slate-400">
            Rasio rata-rata PPh Terutang dibandingkan dengan seluruh Penghasilan Bruto Anda
          </p>
        </div>

        {/* Speedometer Gauge Container */}
        <div className="flex-1 relative flex flex-col items-center justify-center min-h-[120px] md:min-h-[200px]">
          <div className="w-40 h-20 md:w-52 md:h-28 relative overflow-hidden flex items-center justify-center">
            <ResponsiveContainer width="100%" height="200%" style={{ position: 'absolute', top: 0 }}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius="62%"
                  outerRadius="77%"
                  paddingAngle={0}
                  dataKey="value"
                >
                  <Cell fill={activeColor} stroke="none" />
                  <Cell fill="#1e293b" stroke="none" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Centered Speedometer Text */}
            <div className="absolute bottom-0 flex flex-col items-center justify-end select-none">
              <span className="text-2xl md:text-3xl font-black text-white font-mono leading-none tracking-tight">{rate.toFixed(2)}%</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Tarif Efektif (ETR)</span>
            </div>
          </div>
        </div>

        {/* Edu-Explainer Card */}
        <div className="p-3 md:p-3.5 rounded-xl md:rounded-2xl bg-slate-950/40 border border-slate-800 text-[10px] md:text-[11px] font-semibold text-slate-400 leading-snug md:leading-relaxed text-center">
          {rate <= 0 ? (
            <span>Belum ada data penghasilan untuk menghitung rasio tarif efektif pajak Anda.</span>
          ) : rate <= 5 ? (
            <span>Tarif pajak Anda berada di bracket terendah (<span className="text-blue-400">≤5%</span>). Sangat efisien!</span>
          ) : rate <= 15 ? (
            <span>Tarif pajak Anda moderat (<span className="text-indigo-400">5% - 15%</span>). Optimalkan pengurang pajak (PTKP/Zakat) Anda.</span>
          ) : (
            <span>Rasio ETR tinggi (<span className="text-rose-400">&gt;15%</span>). Gunakan simulasi What-If untuk mitigasi legal.</span>
          )}
        </div>
      </div>
    </div>
  );
}
