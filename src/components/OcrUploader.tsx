'use client';

import { useState, useRef, useEffect } from 'react';
import Tooltip from './Tooltip';
import { useAlert } from '@/contexts/AlertContext';

type OcrResult = {
  nominal: number;
  date: string | null;
  vendor: string;
  taxType: string;
};

interface OcrUploaderProps {
  onScanComplete?: (data: OcrResult) => void;
}

export default function OcrUploader({ onScanComplete }: OcrUploaderProps) {
  const { showAlert } = useAlert();
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<OcrResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // We don't use completeScan inside a progress effect anymore.
  // The progress is now driven by the API call timeline.

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Validasi file type sederhana
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      await showAlert('Format Tidak Didukung', 'Mohon unggah file gambar atau PDF.', 'warning');
      return;
    }
    
    setFileName(file.name);
    setIsScanning(true);
    setProgress(0);
    setResult(null);
    setIsEditing(false);
    setErrorMsg(null);

    let isApiDone = false;
    let apiResult: OcrResult | null = null;
    let apiError: string | null = null;

    // Start fake progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90 && !isApiDone) {
          return 90; // Hold at 90% until API is done
        }
        if (isApiDone) {
          clearInterval(interval);
          return 100;
        }
        return prev + 15 + Math.random() * 10;
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses dokumen');
      }
      
      apiResult = {
        nominal: Number(data.nominal) || 0,
        date: data.date || null,
        vendor: data.vendor || 'Tidak diketahui',
        taxType: data.taxType || 'Tidak diketahui',
      };
    } catch (err: any) {
      console.error('OCR Error:', err);
      apiError = err.message;
    } finally {
      isApiDone = true;
      // Force progress to 100 and clean up
      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        setIsScanning(false);
        if (apiError) {
          setErrorMsg(apiError);
        } else if (apiResult) {
          setResult(apiResult);
          setEditForm(apiResult);
          // Force manual verification
          setIsEditing(true);
          
          const isAmbiguous = apiResult.nominal === 0 || apiResult.vendor === 'Tidak diketahui';
          if (isAmbiguous) {
            showAlert('Perhatian', 'Beberapa data gagal diekstrak dengan sempurna. Mohon lengkapi secara manual.', 'warning');
          } else {
            showAlert('Verifikasi Manual', 'Mohon periksa kembali hasil ekstraksi OCR sebelum menerapkannya.', 'info');
          }
        }
      }, 500); // small delay to show 100%
    }
  };

  const handleApplyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editForm) {
      setResult(editForm);
      setIsEditing(false);
      if (onScanComplete) {
        onScanComplete(editForm);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`upload-area relative rounded-2xl border-2 border-dashed transition-all duration-300 p-5 flex flex-col items-center justify-center min-h-[140px] bg-slate-950/40 backdrop-blur-sm
          ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-900/60'}
          ${(isScanning || result) ? 'cursor-default' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={(e) => {
          // If clicking background and we are not editing/scanning/have result, open file picker
          if (!isScanning && !result && !errorMsg) {
            fileInputRef.current?.click();
          }
        }}
      >
        {/* Info Tooltip at Top Right */}
        <div className="absolute top-3 right-3 z-20 cursor-help" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="Unggah foto atau PDF bukti potong/struk Anda. Sistem AI akan otomatis membaca nominal penghasilan bruto dan memasukannya ke kalkulator." align="right" />
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*,application/pdf" 
          className="hidden" 
        />
        
        {isScanning ? (
          <div className="flex flex-col items-center justify-center space-y-4 w-full">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <svg className="w-6 h-6 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
            </div>
            <div className="text-center w-full">
              <p className="text-sm font-bold text-white mb-2">Menganalisis Dokumen dengan AI...</p>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, progress)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">{Math.floor(progress)}% GEMINI VISION</p>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center space-y-3 w-full text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h4 className="text-sm font-bold text-rose-400">Pemindaian Gagal</h4>
            <p className="text-xs text-slate-400">{errorMsg}</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setErrorMsg(null);
                setFileName(null);
              }}
              className="px-4 py-2 mt-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : result ? (
          <div className="flex flex-col items-center justify-center w-full animate-in fade-in zoom-in duration-300 relative z-10" onClick={(e) => e.stopPropagation()}>
            {!isEditing ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div className="text-center mb-4">
                  <h4 className="text-sm font-bold text-white mb-1">Data Berhasil Diekstrak</h4>
                  <p className="text-xs text-slate-400 truncate max-w-[200px]">{fileName}</p>
                </div>
                
                <div className="w-full bg-slate-900/80 rounded-xl p-3 border border-emerald-500/20 text-left space-y-1.5 mb-4">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 uppercase font-bold">Nominal Transaksi</span>
                    <span className="text-emerald-400 font-mono font-bold">Rp {result.nominal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 uppercase font-bold">Vendor/Partner</span>
                    <span className="text-slate-300 font-bold truncate max-w-[120px]">{result.vendor}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 uppercase font-bold">Indikasi Pajak</span>
                    <span className="text-blue-300 font-bold uppercase">{result.taxType}</span>
                  </div>
                  {result.date && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 uppercase font-bold">Tanggal Dokumen</span>
                      <span className="text-slate-300 font-bold">{result.date}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3 w-full">
                  <button 
                    onClick={() => {
                      setResult(null);
                      setFileName(null);
                      setEditForm(null);
                    }}
                    className="flex-1 py-2 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                  >
                    Pindai Lain
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-md shadow-blue-500/20"
                  >
                    Lihat Selengkapnya / Edit
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleApplyEdit} className="w-full">
                <div className="flex flex-col mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      Verifikasi Manual (Wajib)
                    </h4>
                    <button type="button" onClick={() => { setIsEditing(false); setResult(null); setFileName(null); }} className="text-slate-400 hover:text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 text-left">
                    Sistem OCR mungkin tidak 100% akurat. Harap tinjau dan perbaiki data di bawah ini jika terdapat kesalahan.
                  </p>
                </div>

                <div className="space-y-3 mb-5 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nominal (Rp)</label>
                    <input 
                      type="number" 
                      value={editForm?.nominal || 0} 
                      onChange={(e) => setEditForm(prev => prev ? {...prev, nominal: Number(e.target.value)} : null)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vendor / Partner</label>
                    <input 
                      type="text" 
                      value={editForm?.vendor || ''} 
                      onChange={(e) => setEditForm(prev => prev ? {...prev, vendor: e.target.value} : null)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jenis Pajak</label>
                      <input 
                        type="text" 
                        value={editForm?.taxType || ''} 
                        onChange={(e) => setEditForm(prev => prev ? {...prev, taxType: e.target.value} : null)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal</label>
                      <input 
                        type="date" 
                        value={editForm?.date || ''} 
                        onChange={(e) => setEditForm(prev => prev ? {...prev, date: e.target.value} : null)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setEditForm(null);
                      setResult(null);
                      setFileName(null);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Batal Pindai
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-md shadow-emerald-500/20"
                  >
                    Simpan & Terapkan
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="pointer-events-none flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-2 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            </div>
            <h3 className="text-sm font-bold text-slate-200 mb-1">Unggah Bukti Potong / Struk</h3>
            <p className="text-xs text-slate-500 text-center max-w-[250px]">Seret file ke sini atau klik untuk memilih file (JPG, PNG, PDF).</p>
            <div className="mt-3 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-400 font-bold tracking-wider flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              SMART OCR AI
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
