'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useFetchDocuments } from '@/hooks/useDocuments';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentCard from '@/components/documents/DocumentCard';



const CATEGORIES = [
  { id: '', label: 'Semua Kategori' },
  { id: 'bukti_potong', label: 'Bukti Potong' },
  { id: 'faktur_pajak', label: 'Faktur Pajak PPN' },
  { id: 'spt_tahunan', label: 'SPT Tahunan' },
  { id: 'nota_transaksi', label: 'Nota / Kuitansi' },
  { id: 'laporan_keuangan', label: 'Laporan Keuangan' },
  { id: 'rekening_koran', label: 'Rekening Koran' },
  { id: 'surat_keterangan', label: 'Surat Keterangan' },
  { id: 'identitas', label: 'KTP / NPWP' },
  { id: 'lainnya', label: 'Lainnya' },
];

export default function DocumentsPage() {
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterYear, setFilterYear] = useState<number | undefined>(undefined);
  
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [checkingTable, setCheckingTable] = useState(true);

  const [previewData, setPreviewData] = useState<{ url: string; type: string; name: string } | null>(null);

  const { data: documents, isLoading } = useFetchDocuments(filterCategory || undefined, filterYear);

  const checkTableExistence = async () => {
    try {
      setCheckingTable(true);
      const { error } = await supabase
        .from('documents')
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
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
          Berkas <span className="text-blue-500 font-extrabold">Pendukung</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-md leading-relaxed font-medium">
          Sistem manajemen lampiran perpajakan Anda. Terintegrasi dengan penyimpanan awan yang aman.
        </p>
      </div>

      {checkingTable ? (
        <div className="py-20 text-center text-slate-500 font-medium">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-sm">Menghubungkan ke Storage Cloud...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          
          <div className="xl:col-span-1">
            <DocumentUploader />
          </div>

          <div className="xl:col-span-2 space-y-6">
            {/* Filter Bar */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saring Berdasarkan Kategori</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none"
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>

              <div className="w-full sm:w-48 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahun Pajak</label>
                <input
                  type="number"
                  placeholder="Semua Tahun"
                  value={filterYear || ''}
                  onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl h-48 animate-pulse"></div>
                ))}
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {documents.map(doc => (
                  <DocumentCard 
                    key={doc.id} 
                    document={doc} 
                    onPreview={(url, type, name) => setPreviewData({ url, type, name })}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl py-20 px-6 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h4 className="text-lg font-bold text-slate-300 mb-1">Belum Ada Dokumen</h4>
                <p className="text-sm text-slate-500 max-w-sm">
                  Tidak ada dokumen yang ditemukan untuk filter yang Anda pilih. Silakan unggah dokumen baru atau ubah kriteria pencarian.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm cursor-pointer"
            onClick={() => setPreviewData(null)}
          ></div>
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <h3 className="text-white font-bold truncate max-w-lg">{previewData.name}</h3>
              <div className="flex gap-2">
                <a 
                  href={previewData.url} 
                  download={previewData.name}
                  className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                  title="Download File"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0L8 8m4-4v12"></path></svg>
                </a>
                <button 
                  onClick={() => setPreviewData(null)}
                  className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/50 min-h-[50vh]">
              {previewData.type === 'application/pdf' ? (
                <iframe 
                  src={`${previewData.url}#toolbar=0`} 
                  className="w-full h-[75vh] rounded-xl border border-slate-800"
                  title="PDF Preview"
                ></iframe>
              ) : previewData.type.startsWith('image/') ? (
                <Image
                  src={previewData.url}
                  alt={previewData.name}
                  width={1200}
                  height={900}
                  unoptimized
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg border border-slate-800"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <p>Pratinjau tidak tersedia untuk format file ini.</p>
                  <a href={previewData.url} download className="text-blue-400 hover:underline mt-2 inline-block">Silakan unduh file</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
