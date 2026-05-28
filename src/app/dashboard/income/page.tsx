'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import IncomeSourceForm from '@/components/IncomeSourceForm';
import IncomeSourceTable from '@/components/IncomeSourceTable';
import { IncomeSource } from '@/types/taxpayer';



export default function IncomePage() {
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear());
  const [editSource, setEditSource] = useState<IncomeSource | undefined>(undefined);
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [checkingTable, setCheckingTable] = useState(true);

  const checkTableExistence = async () => {
    try {
      setCheckingTable(true);
      const { error } = await supabase
        .from('income_sources')
        .select('id')
        .limit(1);

      setCheckingTable(true);
      setIsTableMissing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingTable(false);
    }
  };

  useEffect(() => {
    checkTableExistence();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
          Multi-Sumber <span className="text-blue-500 font-extrabold">Penghasilan</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-md leading-relaxed font-medium">
          Kelola rincian pendapatan dari berbagai sumber (gaji, freelance, usaha, sewa, investasi) secara terpusat untuk kalkulasi pajak gabungan yang akurat.
        </p>
      </div>

      {checkingTable ? (
        <div className="py-20 text-center text-slate-500 font-medium">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-sm">Menghubungkan ke database perpajakan...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <IncomeSourceForm
              editSource={editSource}
              activeTaxYear={taxYear}
              onSuccess={() => {
                setEditSource(undefined);
              }}
              onCancel={editSource ? () => setEditSource(undefined) : undefined}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pilih Tahun Pajak
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTaxYear(taxYear - 1)}
                  className="p-2 bg-slate-950/50 border border-slate-800 text-white hover:text-blue-400 rounded-lg transition-colors text-xs font-bold"
                >
                  &larr;
                </button>
                <span className="text-sm font-black text-white px-3 font-mono">{taxYear}</span>
                <button
                  onClick={() => setTaxYear(taxYear + 1)}
                  className="p-2 bg-slate-950/50 border border-slate-800 text-white hover:text-blue-400 rounded-lg transition-colors text-xs font-bold"
                >
                  &rarr;
                </button>
              </div>
            </div>

            <IncomeSourceTable
              taxYear={taxYear}
              onEdit={(source) => {
                setEditSource(source);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
