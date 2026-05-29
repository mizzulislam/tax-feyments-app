'use client';

import { useState } from 'react';
import { TaxDocument } from '@/types/taxpayer';
import { useDeleteDocument, getDocumentUrl } from '@/hooks/useDocuments';
import { useAlert } from '@/contexts/AlertContext';

interface DocumentCardProps {
  document: TaxDocument;
  onPreview: (url: string, type: string, name: string) => void;
}

export default function DocumentCard({ document, onPreview }: DocumentCardProps) {
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteDocument();
  const [isOpening, setIsOpening] = useState(false);
  const { showAlert, showConfirm } = useAlert();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'bukti_potong': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'faktur_pajak': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'spt_tahunan': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'laporan_keuangan': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const handleOpen = async () => {
    try {
      setIsOpening(true);
      const url = await getDocumentUrl(document.filePath);
      if (url) {
        onPreview(url, document.fileType, document.fileName);
      } else {
        await showAlert('Gagal', 'Gagal mendapatkan akses dokumen.', 'error');
      }
    } finally {
      setIsOpening(false);
    }
  };

  const handleDelete = async () => {
    if (await showConfirm('Hapus Dokumen', `Apakah Anda yakin ingin menghapus dokumen "${document.fileName}"?`, 'Ya, Hapus', 'Batal', 'error')) {
      deleteDoc(document);
    }
  };

  // Determine icon based on mime type
  const isPdf = document.fileType === 'application/pdf';
  const isImage = document.fileType.startsWith('image/');

  return (
    <div className="group bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 hover:bg-slate-800/80 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${
            isPdf ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            isImage ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            {isPdf ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            ) : isImage ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            )}
          </div>
          
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${getCategoryColor(document.category)}`}>
            {document.category.replace('_', ' ')}
          </span>
        </div>

        <h4 className="text-sm font-bold text-white mb-1 line-clamp-2" title={document.fileName}>
          {document.fileName}
        </h4>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>{formatBytes(document.fileSize)}</span>
          <span>&bull;</span>
          <span>{document.taxYear || '-'}</span>
          {document.isVerified && (
            <>
              <span>&bull;</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                Terverifikasi
              </span>
            </>
          )}
        </div>
        {document.description && (
          <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {document.description}
          </p>
        )}
      </div>

      <div className="mt-5 flex gap-2 pt-4 border-t border-slate-800/60">
        <button
          onClick={handleOpen}
          disabled={isOpening}
          className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isOpening ? (
            <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          )}
          Lihat
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          title="Hapus Dokumen"
        >
          {isDeleting ? (
             <div className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          )}
        </button>
      </div>
    </div>
  );
}
