import { useState } from 'react';
import { useAlert } from '@/contexts/AlertContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export interface IncomeSourceData {
  id: string;
  taxYear: number;
  sourceName: string;
  sourceType: string;
  annualIncome: number;
  isTaxWithheld: boolean;
  withheldAmount: number;
  created_at?: string;
}

export default function TaxHistoryTable({ 
  data,
  variant = 'full',
  onViewAll
}: { 
  data: IncomeSourceData[];
  variant?: 'full' | 'compact';
  onViewAll?: () => void;
}) {
  const router = useRouter();
  const { showAlert, showConfirm } = useAlert();
  const queryClient = useQueryClient();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const response = await fetch(`/api/income?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Terjadi kesalahan saat menghapus data.');
      }
    },
    onSuccess: (_, id) => {
      setDeletedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['income_sources'] });
      showAlert('Berhasil', 'Data penghasilan berhasil dihapus.', 'success');
    },
    onError: (error) => {
      showAlert('Gagal', `Gagal menghapus data: ${error.message}`, 'error');
    }
  });

  const handleDelete = async (id: string) => {
    if (await showConfirm('Hapus Data', 'Apakah Anda yakin ingin menghapus catatan penghasilan ini?', 'Ya, Hapus', 'Batal', 'error')) {
      deleteMutation.mutate(id);
    }
  };
  
  const formatSourceType = (type: string) => {
    const formatMap: Record<string, string> = {
      'pekerjaan_tetap': 'Pekerjaan Tetap',
      'pekerjaan_bebas': 'Pekerjaan Bebas',
      'usaha': 'Usaha (UMKM)',
      'sewa': 'Sewa Aset',
      'investasi': 'Investasi',
      'lainnya': 'Lain-lain'
    };
    return formatMap[type] || type;
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
      <div className="p-4 md:p-8 border-b border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h3 className="font-bold text-lg md:text-xl text-white tracking-tight">Riwayat Pencatatan</h3>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Pantau arsip pencatatan sumber penghasilan multi-sumber Anda secara komprehensif.</p>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 md:py-24 px-5 md:px-6 text-center">
          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 md:mb-6 shadow-inner">
            <svg className="w-7 h-7 md:w-10 md:h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h4 className="text-base md:text-lg font-medium text-slate-300 mb-2">Belum Ada Catatan Penghasilan</h4>
          <p className="text-xs md:text-sm text-slate-500 max-w-sm">Mulai catat sumber penghasilan Anda melalui halaman multi-sumber penghasilan untuk melihat riwayat tersimpan.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto w-full [scrollbar-width:thin] [scrollbar-color:rgba(59,130,246,0.5)_transparent]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider md:tracking-widest border-b border-slate-800/50 divide-x divide-slate-800/30">
                  <th className="p-2 md:p-4 whitespace-nowrap text-center">Tahun Pajak</th>
                  <th className="p-2 md:p-4 whitespace-nowrap text-center">Sumber Penghasilan</th>
                  <th className="p-2 md:p-4 whitespace-nowrap text-center">Jenis</th>
                  <th className="p-2 md:p-4 whitespace-nowrap text-center">Penghasilan Bruto</th>
                  {variant === 'full' && (
                    <th className="p-2 md:p-4 whitespace-nowrap hidden sm:table-cell text-center">Status Potong</th>
                  )}
                  {variant === 'full' && (
                    <th className="p-2 md:p-4 whitespace-nowrap text-center">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-[10px] md:text-xs">
                {data.filter(r => !deletedIds.has(r.id)).map((report) => (
                  <tr key={report.id} className="group hover:bg-slate-800/30 transition-all duration-300 divide-x divide-slate-800/30">
                    <td className="p-2 md:p-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">{report.taxYear}</p>
                          {report.created_at && (
                            <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                              {new Date(report.created_at).toLocaleDateString('id-ID', { month: 'long' })}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 md:p-4 text-slate-300 font-medium whitespace-nowrap">
                      {report.sourceName}
                    </td>
                    <td className="p-2 md:p-4 text-center whitespace-nowrap">
                      <span className="px-2 py-1 bg-slate-800/60 text-slate-300 rounded text-[10px] font-semibold">{formatSourceType(report.sourceType)}</span>
                    </td>
                    <td className="p-2 md:p-4 font-mono whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg bg-slate-800/50 text-slate-200 font-semibold shadow-inner text-[10px] md:text-xs">
                        Rp {report.annualIncome.toLocaleString('id-ID')}
                      </span>
                    </td>
                    {variant === 'full' && (
                      <td className="p-2 md:p-4 whitespace-nowrap hidden sm:table-cell text-[10px] md:text-xs text-center">
                        {report.isTaxWithheld ? (
                          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                            Rp {report.withheldAmount.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-slate-800/50 text-slate-400 border border-slate-700 font-semibold text-[10px]">TIDAK DIPOTONG</span>
                        )}
                      </td>
                    )}
                    {variant === 'full' && (
                      <td className="p-2 md:p-4 text-center whitespace-nowrap">
                        <div className="flex justify-center gap-1.5 md:gap-2">
                          <button
                            onClick={() => router.push('/dashboard/income')}
                            className="px-2 py-1 md:px-2.5 md:py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg md:rounded-xl transition-all border border-blue-500/20 inline-flex items-center justify-center gap-1 font-bold text-[10px] md:text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                            title="Kelola Penghasilan"
                          >
                            <svg className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="px-2 py-1 md:px-2.5 md:py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg md:rounded-xl transition-all border border-rose-500/20 inline-flex items-center justify-center gap-1 font-bold text-[10px] md:text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                            title="Hapus Data"
                          >
                            <svg className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {variant === 'compact' && onViewAll && (
            <div className="p-4 border-t border-slate-800/50 flex justify-center bg-slate-900/30">
              <button
                onClick={onViewAll}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 font-bold text-xs uppercase tracking-widest rounded-full transition-all border border-blue-500/20 shadow-sm"
              >
                Lihat Selengkapnya
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
