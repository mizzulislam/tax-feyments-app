'use client';

import { useFetchIncomeSources, useDeleteIncomeSource } from '@/hooks/useIncomeSources';
import { IncomeSource } from '@/types/taxpayer';
import { useAlert } from '@/contexts/AlertContext';

interface IncomeSourceTableProps {
  taxYear: number;
  onEdit: (source: IncomeSource) => void;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
  '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
  '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
};

const TYPE_LABELS: Record<string, { label: string; badge: string }> = {
  pekerjaan_tetap: {
    label: 'Pekerjaan Tetap',
    badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  },
  pekerjaan_bebas: {
    label: 'Pekerjaan Bebas (Freelance)',
    badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
  },
  usaha: {
    label: 'Usaha / UMKM (PP 23)',
    badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
  sewa: {
    label: 'Sewa Properti (Final 10%)',
    badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  },
  investasi: {
    label: 'Investasi (Dividen/Bunga)',
    badge: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
  },
  lainnya: {
    label: 'Penghasilan Lain-lain',
    badge: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
  },
};

export default function IncomeSourceTable({ taxYear, onEdit }: IncomeSourceTableProps) {
  const { data: sources = [], isLoading, isError, error } = useFetchIncomeSources(taxYear);
  const deleteMutation = useDeleteIncomeSource();
  const { showAlert, showConfirm } = useAlert();

  const handleDelete = async (id: string, name: string) => {
    if (await showConfirm('Hapus Sumber', `Apakah Anda yakin ingin menghapus sumber penghasilan "${name}"?`, 'Ya, Hapus', 'Batal', 'error')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Kesalahan tidak dikenal.';
        await showAlert('Gagal', `Gagal menghapus data: ${message}`, 'error');
      }
    }
  };

  const totalIncome = sources.reduce((acc, curr) => acc + curr.annualIncome, 0);
  const totalWithheld = sources.reduce((acc, curr) => acc + (curr.isTaxWithheld ? curr.withheldAmount || 0 : 0), 0);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4">
      <div className="p-5 border-b border-slate-800 bg-slate-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Rincian Multi-Penghasilan ({taxYear})
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Daftar seluruh penghasilan neto/bruto setahun yang dilaporkan.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider divide-x divide-slate-800/30">
              <th className="py-4 px-6 text-center">Sumber Penghasilan</th>
              <th className="py-4 px-6 text-center">Pemotong Pajak</th>
              <th className="py-4 px-6 text-center">Kategori</th>
              <th className="py-4 px-6 text-center">Penghasilan Setahun</th>
              <th className="py-4 px-6 text-center">Kredit Pajak (Dipotong)</th>
              <th className="py-4 px-6 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-xs font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mr-2"></div>
                  Memuat rincian penghasilan...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-red-400 font-medium">
                  Gagal memuat data: {error?.message}
                </td>
              </tr>
            ) : sources.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-medium leading-relaxed">
                  Belum ada sumber penghasilan tercatat untuk tahun pajak {taxYear}.
                </td>
              </tr>
            ) : (
              sources.map((s) => (
                <tr key={s.id} className="hover:bg-slate-900/20 transition-all duration-150 divide-x divide-slate-800/30">
                  <td className="py-4.5 px-6">
                    <span className="font-bold text-white block mb-0.5">{s.sourceName}</span>
                    {s.metadata?.jenisPemotongan === 'bulanan' && s.metadata?.taxPeriod && (
                      <span className="text-[10px] text-blue-400 font-bold block mb-0.5">
                        Masa Pajak: {MONTH_NAMES[s.metadata.taxPeriod as string] || s.metadata.taxPeriod}
                      </span>
                    )}
                  </td>
                  <td className="py-4.5 px-6">
                    {s.namaPemotong ? (
                      <span className="text-[11px] font-bold text-white block mb-0.5">
                        {s.namaPemotong}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic block mb-0.5">Tanpa Nama Pemotong</span>
                    )}
                    {s.npwpPemotong ? (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        NPWP: {s.npwpPemotong}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600 block">NPWP tidak tersedia</span>
                    )}
                  </td>
                  <td className="py-4.5 px-6 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          TYPE_LABELS[s.sourceType]?.badge || 'bg-slate-500/10 border-slate-500/30 text-slate-300'
                        }`}
                      >
                        {TYPE_LABELS[s.sourceType]?.label || s.sourceType}
                      </span>
                      {s.metadata && (
                        <span className="text-[9px] text-slate-500 font-medium">
                          {s.sourceType === 'pekerjaan_bebas' && s.metadata.tidakFinalCategory}
                          {s.sourceType === 'sewa' && (s.metadata.sewaKategori === 'pphFinal' ? 'PPh Final 10%' : 'PPh 23 (2%)')}
                          {s.sourceType === 'investasi' && String(s.metadata.investasiKategori).replace('investasi_', '')}
                          {s.sourceType === 'lainnya' && String(s.metadata.lainnyaKategori).replace('pph22_', '').replace('pph23_', '')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4.5 px-6 font-bold text-white font-mono whitespace-nowrap">
                    Rp {s.annualIncome.toLocaleString('id-ID')}
                  </td>
                  <td className="py-4.5 px-6 whitespace-nowrap">
                    {s.isTaxWithheld ? (
                      <div>
                        <span className="font-bold text-emerald-400 font-mono">
                          Rp {(s.withheldAmount || 0).toLocaleString('id-ID')}
                        </span>
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-extrabold mt-0.5">
                          Bukti Potong Aktif
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 font-semibold italic text-[11px]">Nihil / Belum Dipotong</span>
                    )}
                  </td>
                  <td className="py-4.5 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onEdit(s)}
                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 rounded-lg transition-colors border border-blue-500/20"
                        title="Edit Sumber"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          ></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.sourceName)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-red-500/20"
                        title="Hapus Sumber"
                        disabled={deleteMutation.isPending}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sources.length > 0 && (
        <div className="p-5 border-t border-slate-800 bg-slate-950/20 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="flex justify-between items-center md:border-r md:border-slate-800/80 md:pr-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Penghasilan Setahun:</span>
            <span className="text-md font-black text-blue-400 font-mono">
              Rp {totalIncome.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between items-center md:pl-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Kredit Pajak PPh (Dipotong):</span>
            <span className="text-md font-black text-emerald-400 font-mono">
              Rp {totalWithheld.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
