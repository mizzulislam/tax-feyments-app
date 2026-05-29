'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { WhatIfScenarioInput } from '@/types/taxpayer';
import { calculateProgressiveTax, calculateUmkmTax, compareScenarios, calculateAdditionalDeductions } from '@/lib/taxEngine';
import ScenarioBuilder from '@/components/whatif/ScenarioBuilder';
import ScenarioComparisonCard from '@/components/whatif/ScenarioComparisonCard';
import { useWhatIfScenarios, useCreateScenario, useDeleteScenario } from '@/hooks/useWhatIfScenarios';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/contexts/AlertContext';



export default function WhatIfPage() {
  const router = useRouter();
  const { showAlert, showConfirm } = useAlert();
  
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [checkingTable, setCheckingTable] = useState(true);

  // Queries
  const { data: savedScenarios, isLoading: isScenariosLoading } = useWhatIfScenarios();
  const { mutate: createScenario, isPending: isCreating } = useCreateScenario();
  const { mutate: deleteScenario, isPending: isDeleting } = useDeleteScenario();

  // State builder
  const [scenario, setScenario] = useState<Partial<WhatIfScenarioInput>>({
    scenarioName: '',
    simAdditionalIncome: 0,
    simAdditionalDeductions: 0,
    simUmkmMode: false,
    simUmkmOmzet: 0,
    notes: ''
  });

  // Base computation data
  const [baseGross, setBaseGross] = useState(0);
  const [basePtkp, setBasePtkp] = useState('TK/0');
  const [baseTax, setBaseTax] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Check table and load baseline data
  const checkTableAndLoadData = async () => {
    try {
      setCheckingTable(true);
      setCheckingTable(true);
      setIsTableMissing(false);

      // Load Profile for PTKP
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      let initPtkp = 'TK/0';
      if (profile) {
        const d = Math.min(Math.max(0, profile.dependents || 0), 3);
        const m = profile.marital_status === 'K' ? 'K' : 'TK';
        initPtkp = `${m}/${d}`;
      }

      // Load latest report for base income
      const { data: reports } = await supabase.from('tax_reports').select('gross_income, tax_payable').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
      
      let initGross = 120000000;
      let initTax = 0;

      if (reports && reports.length > 0) {
        initGross = Number(reports[0].gross_income);
        initTax = Number(reports[0].tax_payable);
      } else {
        // Compute default tax if no report
        const ptkpMap: Record<string, number> = { 'TK/0': 54000000, 'TK/1': 58500000, 'TK/2': 63000000, 'TK/3': 67500000, 'K/0': 58500000, 'K/1': 63000000, 'K/2': 67500000, 'K/3': 72000000 };
        const ptkpValue = ptkpMap[initPtkp] || 54000000;
        const pkp = Math.max(0, initGross - ptkpValue);
        initTax = calculateProgressiveTax(pkp);
      }

      setBaseGross(initGross);
      setBasePtkp(initPtkp);
      setBaseTax(initTax);
      
      setScenario(prev => ({
        ...prev,
        baseGrossIncome: initGross,
        basePtkpStatus: initPtkp,
        baseTaxResult: initTax,
        simPtkpStatus: initPtkp,
      }));

      setIsDataLoaded(true);

    } catch (err) {
      console.error(err);
    } finally {
      setCheckingTable(false);
    }
  };

  useEffect(() => {
    checkTableAndLoadData();
  }, []);

  // Computation Logic
  const computeSimulation = () => {
    let simGross = baseGross + (scenario.simAdditionalIncome || 0);
    const deductions = calculateAdditionalDeductions(simGross, scenario.simAdditionalDeductions || 0);
    simGross = Math.max(0, simGross - deductions);

    const ptkpMap: Record<string, number> = { 'TK/0': 54000000, 'TK/1': 58500000, 'TK/2': 63000000, 'TK/3': 67500000, 'K/0': 58500000, 'K/1': 63000000, 'K/2': 67500000, 'K/3': 72000000 };
    const ptkpValue = ptkpMap[scenario.simPtkpStatus || basePtkp] || 54000000;

    let simTax = 0;

    if (scenario.simUmkmMode) {
      // Jika mode UMKM, gross income progresif tidak dihitung, langsung hitung tarif UMKM pada omzet simulasi
      simTax = calculateUmkmTax(scenario.simUmkmOmzet || 0);
    } else {
      // Mode Progresif
      const pkp = Math.max(0, simGross - ptkpValue);
      simTax = calculateProgressiveTax(pkp);
    }

    const { diff, pct } = compareScenarios(baseTax, simTax);

    return {
      simGross,
      simTax,
      diff,
      pct
    };
  };

  const { simGross: finalSimGross, simTax: finalSimTax, diff, pct } = computeSimulation();

  const handleSaveScenario = async () => {
    if (!scenario.scenarioName) {
      await showAlert('Peringatan', 'Nama skenario wajib diisi.', 'warning');
      return;
    }
    
    const payload: WhatIfScenarioInput = {
      scenarioName: scenario.scenarioName,
      baseGrossIncome: baseGross,
      basePtkpStatus: basePtkp,
      baseTaxResult: baseTax,
      simGrossIncome: finalSimGross,
      simPtkpStatus: scenario.simPtkpStatus || basePtkp,
      simAdditionalIncome: scenario.simAdditionalIncome || 0,
      simAdditionalDeductions: scenario.simAdditionalDeductions || 0,
      simUmkmMode: scenario.simUmkmMode || false,
      simUmkmOmzet: scenario.simUmkmOmzet || 0,
      simTaxResult: finalSimTax,
      taxDifference: diff,
      savingsPercentage: pct,
      notes: scenario.notes || ''
    };

    createScenario(payload, {
      onSuccess: () => {
        setScenario({
          scenarioName: '',
          simAdditionalIncome: 0,
          simAdditionalDeductions: 0,
          simUmkmMode: false,
          simUmkmOmzet: 0,
          notes: ''
        });
        showAlert('Berhasil', 'Skenario berhasil disimpan!', 'success');
      }
    });
  };

  const handleAskAI = () => {
    const contextStr = `Saya sedang membuat simulasi perencanaan pajak bernama "${scenario.scenarioName || 'Skenario Baru'}". 
Kondisi Awal: Pajak terutang Rp ${baseTax.toLocaleString('id-ID')}.
Kondisi Simulasi: Pajak terutang menjadi Rp ${finalSimTax.toLocaleString('id-ID')}.
Selisih: Rp ${diff.toLocaleString('id-ID')} (${pct.toFixed(2)}%).
Tambahan Penghasilan: Rp ${(scenario.simAdditionalIncome||0).toLocaleString('id-ID')}.
Mode UMKM: ${scenario.simUmkmMode ? 'Ya' : 'Tidak'}.

Bisakah Anda memberikan saran atau strategi perencanaan pajak lebih lanjut untuk mengoptimalkan skenario ini?`;

    localStorage.setItem('ai_initial_context', contextStr);
    router.push('/dashboard/chat');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
          Simulasi <span className="text-blue-500 font-extrabold">What-If</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-md leading-relaxed font-medium">
          Bangun skenario masa depan, bandingkan pajak Anda secara real-time, dan simpan strategi perencanaan keuangan Anda.
        </p>
      </div>

      {checkingTable ? (
        <div className="py-20 text-center text-slate-500 font-medium">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-sm">Menyiapkan Mesin Simulasi...</p>
        </div>
      ) : isDataLoaded && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="lg:col-span-1">
              <ScenarioBuilder 
                value={scenario} 
                onChange={setScenario} 
              />
              
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSaveScenario}
                  disabled={isCreating}
                  className="flex-1 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50"
                >
                  {isCreating ? 'Menyimpan...' : 'Simpan Skenario'}
                </button>
                <button
                  onClick={handleAskAI}
                  className="flex-1 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Tanya My Tax
                </button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <ScenarioComparisonCard 
                baseTaxResult={baseTax}
                simTaxResult={finalSimTax}
                taxDifference={diff}
                savingsPercentage={pct}
              />
            </div>
          </div>

          {/* Saved Scenarios List */}
          <div className="pt-12 border-t border-slate-800/80">
            <h3 className="text-xl font-bold text-white tracking-tight mb-6">Riwayat Perencanaan Anda</h3>
            
            {isScenariosLoading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-slate-900/50 rounded-2xl animate-pulse"></div>)}
               </div>
            ) : savedScenarios && savedScenarios.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedScenarios.map(s => {
                  const isSaving = s.taxDifference > 0;
                  const isLosing = s.taxDifference < 0;
                  return (
                    <div key={s.id} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-white text-sm line-clamp-1" title={s.scenarioName}>{s.scenarioName}</h4>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${isSaving ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isLosing ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                            {isSaving ? `Hemat ${Math.abs(s.savingsPercentage).toFixed(1)}%` : isLosing ? 'Naik' : 'Tetap'}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-400">
                          <div className="flex justify-between">
                            <span>Kondisi Awal:</span>
                            <span className="font-medium text-slate-300">Rp {s.baseTaxResult.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Skenario:</span>
                            <span className="font-medium text-white">Rp {s.simTaxResult.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                        {s.notes && <p className="mt-3 text-xs text-slate-500 italic line-clamp-2">&quot;{s.notes}&quot;</p>}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-end">
                        <button 
                          onClick={async () => {
                            if(await showConfirm('Hapus Skenario', 'Hapus skenario ini?', 'Ya, Hapus', 'Batal', 'error')) deleteScenario(s.id);
                          }}
                          disabled={isDeleting}
                          className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors disabled:opacity-50"
                        >
                          Hapus Skenario
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl py-12 text-center text-slate-500">
                <p className="text-sm">Belum ada skenario yang tersimpan.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
