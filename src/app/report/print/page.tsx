'use client';

import { useDemoStore } from '@/store/useDemoStore';
import { useTaxpayerStore } from '@/store/useTaxpayerStore';
import { calculateReadiness } from '@/lib/readinessEngine';
import { useFetchReports } from '@/hooks/useFetchReports';
import { useFetchIncomeSources } from '@/hooks/useIncomeSources';
import { useFetchDocuments } from '@/hooks/useDocuments';
import { useFetchAssets } from '@/hooks/useAssets';
import { useFetchChatSessions } from '@/hooks/useChatSessions';
import { useFetchChatMessages } from '@/hooks/useChatMessages';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IncomeSource, TaxDocument, Asset } from '@/types/taxpayer';

export default function PrintReportPage() {
  const [mounted, setMounted] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const taxYear = new Date().getFullYear();
  
  const profile = useTaxpayerStore((state) => state.profile);
  const { data: reports } = useFetchReports();
  const { data: _incomeSources } = useFetchIncomeSources(taxYear);
  const incomeSources = _incomeSources as IncomeSource[] | undefined;
  
  const { data: _documents } = useFetchDocuments(undefined, taxYear);
  const documents = _documents as TaxDocument[] | undefined;
  
  const { data: _assets } = useFetchAssets(taxYear);
  const assets = _assets as Asset[] | undefined;
  const { data: chatSessions } = useFetchChatSessions();
  const latestSessionId = chatSessions?.[0]?.id || null;
  const { data: chatMessages } = useFetchChatMessages(latestSessionId);
  
  const { isDemoMode, persona, demoProfile, demoIncomeSources, demoDocuments, demoReports } = useDemoStore();

  useEffect(() => {
    let isSubscribed = true;
    const loadProfileAndPrint = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !useTaxpayerStore.getState().profile) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profileData && isSubscribed) {
            useTaxpayerStore.getState().setProfile({
              fullName: profileData.full_name,
              taxpayerType: profileData.taxpayer_type as 'pribadi' | 'badan',
              nik: profileData.nik,
              npwp: profileData.npwp,
              phoneNumber: profileData.phone_number,
              occupation: profileData.occupation,
              education: profileData.education,
              maritalStatus: profileData.marital_status,
              dependents: profileData.dependents,
              hobbies: profileData.hobbies,
              role: profileData.role || 'user',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching profile for report:', err);
      } finally {
        if (isSubscribed) {
          setMounted(true);
          const originalTitle = document.title;
          document.title = 'My Tax';
          setTimeout(() => {
            window.print();
            document.title = originalTitle;
          }, 1500); // 1.5s delay to ensure React Query data also loads
        }
      }
    };

    loadProfileAndPrint();

    return () => {
      isSubscribed = false;
    };
  }, []);

  useEffect(() => {
    const fetchUrls = async () => {
      if (!documents || documents.length === 0) return;
      const urls: Record<string, string> = {};
      
      for (const doc of documents) {
        if (isDemoMode && doc.filePath.startsWith('demo/')) {
          urls[doc.id] = '/logos/my-tax-logo-icon.svg'; // Placeholder for demo
        } else {
          const { data } = await supabase.storage.from('tax-documents').createSignedUrl(doc.filePath, 3600);
          if (data?.signedUrl) {
            urls[doc.id] = data.signedUrl;
          } else {
            const publicData = supabase.storage.from('tax-documents').getPublicUrl(doc.filePath);
            urls[doc.id] = publicData.data.publicUrl;
          }
        }
      }
      setDocumentUrls(urls);
    };

    if (documents) {
      fetchUrls();
    }
  }, [documents, isDemoMode]);

  if (!mounted) return null;

  let readiness: ReturnType<typeof calculateReadiness>;
  if (isDemoMode) {
    readiness = calculateReadiness({ 
      profile: demoProfile || profile, 
      reports: demoReports || reports, 
      incomeSources: (demoIncomeSources || incomeSources) as any, 
      documents: (demoDocuments || documents) as any, 
      taxYear 
    });
  } else {
    readiness = calculateReadiness({ 
      profile, 
      reports, 
      incomeSources: incomeSources as any, 
      documents: documents as any, 
      taxYear 
    });
  }

  const currentDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { 
            margin-top: 0; 
            margin-bottom: 12mm; 
            margin-left: 12mm; 
            margin-right: 12mm; 
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
      <div className="bg-white min-h-screen text-black p-8 max-w-4xl mx-auto font-sans print:p-0 print:m-0 print:max-w-full">
      {/* Print Controls */}
      <div className="flex justify-end items-center mb-8 print:hidden">
        <button 
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-700 text-white rounded-lg font-bold shadow-md hover:bg-blue-800 mr-4"
        >
          Cetak Dokumen
        </button>
        <button 
          onClick={() => window.close()}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300"
        >
          Tutup
        </button>
      </div>

      {/* Header (Professional) */}
      <div className="bg-blue-800 text-white p-6 mb-8 flex justify-between items-start print:bg-blue-800 print:text-white print:relative print:z-10 print:mb-[-12mm]" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-lg">
            <img src="/logos/my-tax-logo-icon.svg" alt="My Tax Logo" className="w-14 h-14" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">My Tax</h1>
            <p className="text-sm text-blue-100 font-medium">Tax Readiness & Assistance Report</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-blue-50">Tahun Pajak: {taxYear}</p>
          <p className="text-xs text-blue-200 mt-1">Dicetak pada: {currentDate}</p>
        </div>
      </div>

      <table className="w-full border-0 m-0 p-0 border-collapse">
        <thead className="hidden print:table-header-group">
          <tr>
            <td className="h-[12mm] border-0 p-0 m-0 align-bottom pb-2">
              <div className="flex justify-between items-end w-full text-[10px] font-bold text-black">
                <span>{currentDate}</span>
                <span>My Tax</span>
              </div>
            </td>
          </tr>
        </thead>
        <tbody className="border-0 p-0 m-0">
          <tr>
            <td className="border-0 p-0 m-0">
              <div className="hidden print:block h-8"></div>
      {/* Section 1: Data Identitas Wajib Pajak */}
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">Identitas Wajib Pajak</h2>
        <table className="w-full text-sm border-collapse border border-gray-300">
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2 font-semibold w-1/4 bg-gray-50">Nama Lengkap</td>
              <td className="border border-gray-300 p-2 w-1/4">{isDemoMode ? (persona || 'Demo User') : (profile?.fullName || '-')}</td>
              <td className="border border-gray-300 p-2 font-semibold w-1/4 bg-gray-50">NPWP</td>
              <td className="border border-gray-300 p-2 w-1/4">{isDemoMode ? '-' : (profile?.npwp || '-')}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">NIK</td>
              <td className="border border-gray-300 p-2">{isDemoMode ? '-' : (profile?.nik || '-')}</td>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Status / PTKP</td>
              <td className="border border-gray-300 p-2">{isDemoMode ? '-' : `${profile?.maritalStatus || '-'} / ${profile?.dependents || '0'} Tanggungan`}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Pekerjaan / Profesi</td>
              <td className="border border-gray-300 p-2">{isDemoMode ? '-' : (profile?.occupation || '-')}</td>
              <td className="border border-gray-300 p-2 font-semibold bg-gray-50">Nomor Telepon</td>
              <td className="border border-gray-300 p-2">{isDemoMode ? '-' : (profile?.phoneNumber || '-')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 2: Ringkasan Kesiapan SPT */}
      <div className="mb-6">
        <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">Status Kesiapan Pelaporan</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-300 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase">Readiness Score</p>
            <p className="text-3xl font-black mt-1">{readiness.score} / 100</p>
          </div>
          <div className="border border-gray-300 p-4">
            <p className="text-xs font-bold text-gray-500 uppercase">Status Kesehatan Pajak</p>
            <p className="text-xl font-bold mt-2">{readiness.health}</p>
          </div>
        </div>
      </div>

      {/* Section 3: Data Tersedia vs Kekurangan */}
      <div className="grid grid-cols-2 gap-6 mb-6 items-stretch">
        <div className="flex flex-col h-full">
          <h3 className="text-sm font-bold bg-gray-100 border border-gray-300 p-2">Data & Dokumen Tersedia</h3>
          <ul className="flex-1 list-disc list-inside text-sm border border-gray-300 border-t-0 p-3 space-y-1">
            {readiness.completedItems.length > 0 ? (
              readiness.completedItems.map((item, idx) => <li key={idx}>{item}</li>)
            ) : (
              <li className="text-gray-500 italic">Belum ada data tersedia.</li>
            )}
          </ul>
        </div>
        <div className="flex flex-col h-full">
          <h3 className="text-sm font-bold bg-gray-100 border border-gray-300 p-2">Catatan Kekurangan</h3>
          <ul className="flex-1 list-disc list-inside text-sm border border-gray-300 border-t-0 p-3 space-y-1">
            {readiness.missingItems.length > 0 ? (
              readiness.missingItems.map((item, idx) => <li key={idx} className="text-red-700">{item}</li>)
            ) : (
              <li className="text-gray-500 italic">Seluruh dokumen dan profil telah lengkap.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Section 4: Inventaris Lampiran Dokumen */}
      <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
        <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">Daftar Lampiran Dokumen</h2>
        {documents && documents.length > 0 ? (
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-center w-12">No</th>
                <th className="border border-gray-300 p-2 text-left">Nama Dokumen</th>
                <th className="border border-gray-300 p-2 text-left w-1/3">Kategori</th>
                <th className="border border-gray-300 p-2 text-left w-32">Status Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, idx) => (
                <tr key={doc.id}>
                  <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 p-2">{doc.fileName}</td>
                  <td className="border border-gray-300 p-2 uppercase text-xs">{doc.category.replace(/_/g, ' ')}</td>
                  <td className="border border-gray-300 p-2 text-xs">{doc.isVerified ? 'Terverifikasi' : 'Belum Diverifikasi'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500 border border-gray-300 p-4 text-center">Tidak ada dokumen lampiran yang diunggah dalam sistem.</p>
        )}
      </div>

      {/* Section 5: Rencana Aksi (Tindakan Lanjut) */}
      <div className="mb-8 border border-black p-4" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="text-sm font-bold uppercase mb-2">Rencana Aksi & Rekomendasi (Untuk Asistensi DJP)</h3>
        <ul className="list-decimal list-inside text-sm space-y-1">
          {readiness.nextActions.length > 0 ? (
            readiness.nextActions.map((action, idx) => <li key={idx}>{action}</li>)
          ) : (
            <li>Seluruh data tervalidasi oleh sistem internal My Tax. Lanjutkan ke pengisian formulir di Coretax.</li>
          )}
        </ul>
      </div>

      {/* Section 6: Riwayat Konsultasi (AI Chatbot - Hanya Pertanyaan Wajib Pajak) */}
      <div className="mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">Riwayat Pertanyaan Wajib Pajak (Sesi Terakhir)</h2>
        {chatMessages && chatMessages.filter(m => m.role === 'user').length > 0 ? (
          <div className="border border-gray-300 p-4 space-y-3">
            {chatMessages.filter(m => m.role === 'user').map((msg) => (
              <div key={msg.id} className="flex flex-col bg-gray-100 p-3 rounded-lg border border-gray-200">
                <span className="text-xs font-bold text-gray-500 mb-1">Pertanyaan Wajib Pajak:</span>
                <div className="text-sm text-black">
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 border border-gray-300 p-4 text-center">Tidak ada riwayat pertanyaan pada sesi terakhir.</p>
        )}
      </div>

      {/* --- HALAMAN LAMPIRAN --- */}
      <div className="print:break-before-page pt-8">
        <h1 className="text-3xl font-black uppercase border-b-4 border-black pb-2 mb-6">Lampiran Laporan</h1>
        
        {/* Section 7: Rincian Penghasilan */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">Lampiran 1: Rincian Penghasilan</h2>
          {incomeSources && incomeSources.length > 0 ? (
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-center w-12">No</th>
                  <th className="border border-gray-300 p-2 text-left">Nama Pemotong / Sumber</th>
                  <th className="border border-gray-300 p-2 text-left">Jenis Penghasilan</th>
                  <th className="border border-gray-300 p-2 text-right">Penghasilan Bruto (Rp)</th>
                  <th className="border border-gray-300 p-2 text-right">Pajak Dipotong (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {incomeSources.map((income, idx) => (
                  <tr key={income.id}>
                    <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                    <td className="border border-gray-300 p-2">{income.sourceName}</td>
                    <td className="border border-gray-300 p-2 uppercase text-xs">{income.sourceType.replace(/_/g, ' ')}</td>
                    <td className="border border-gray-300 p-2 text-right">{income.annualIncome.toLocaleString('id-ID')}</td>
                    <td className="border border-gray-300 p-2 text-right">{income.isTaxWithheld ? (income.withheldAmount || 0).toLocaleString('id-ID') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500 border border-gray-300 p-4 text-center">Belum ada data penghasilan.</p>
          )}
        </div>

        {/* Section 8: Daftar Harta & Aset */}
        <div className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <h2 className="text-lg font-bold uppercase border-b border-gray-300 pb-1 mb-3">Lampiran 2: Daftar Harta & Aset</h2>
          {assets && assets.length > 0 ? (
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-center w-12">No</th>
                  <th className="border border-gray-300 p-2 text-left">Nama Harta</th>
                  <th className="border border-gray-300 p-2 text-center">Tahun Perolehan</th>
                  <th className="border border-gray-300 p-2 text-right">Harga Perolehan (Rp)</th>
                  <th className="border border-gray-300 p-2 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, idx) => (
                  <tr key={asset.id}>
                    <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                    <td className="border border-gray-300 p-2">{asset.assetName}</td>
                    <td className="border border-gray-300 p-2 text-center">{asset.acquisitionYear}</td>
                    <td className="border border-gray-300 p-2 text-right">{asset.acquisitionValue.toLocaleString('id-ID')}</td>
                    <td className="border border-gray-300 p-2 text-xs">{asset.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500 border border-gray-300 p-4 text-center">Belum ada data harta atau aset yang dilaporkan.</p>
          )}
        </div>
      </div>
      {/* Section 9: Lampiran Dokumen Fisik */}
      <div className="print:break-before-page">
        <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-6">Lampiran Bukti Dokumen</h2>
        {documents && documents.length > 0 ? (
          <div className="space-y-8">
            {documents.map((doc, idx) => {
              const fileUrl = documentUrls[doc.id];
              const isImage = doc.fileType?.includes('image') || doc.filePath.match(/\.(jpeg|jpg|gif|png)$/i);
              
              if (!fileUrl) return (
                <div key={doc.id} className="border border-gray-300 p-6 text-center text-gray-500">
                  <p>Memuat URL dokumen...</p>
                </div>
              );

              return (
                <div key={doc.id} className="border border-gray-300 p-6" style={{ pageBreakInside: 'avoid' }}>
                  <h3 className="font-bold text-lg mb-2">Lampiran {idx + 1}: {doc.fileName}</h3>
                  <p className="text-sm text-gray-600 mb-4 uppercase">Kategori: {doc.category.replace(/_/g, ' ')}</p>
                  
                  {isImage ? (
                    <div className="w-full flex justify-center bg-gray-50 border border-gray-200 p-2">
                      <img src={fileUrl} alt={doc.fileName} className="max-w-full max-h-[800px] object-contain" />
                    </div>
                  ) : (
                    <div className="w-full bg-gray-50 border border-gray-200 p-8 flex flex-col items-center justify-center text-center">
                      <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                      <p className="font-bold text-gray-700">Dokumen PDF/Lainnya</p>
                      <p className="text-sm text-gray-500 mb-4">File terlampir dalam arsip digital My Tax. Unduh manual via link berikut:</p>
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs break-all">
                        {fileUrl}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 p-8 text-center border border-gray-300">Tidak ada lampiran fisik untuk ditampilkan.</p>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="text-[10px] text-gray-500 text-justify border-t border-gray-300 pt-4 mt-8 pb-8">
        <strong>PENTING / DISCLAIMER:</strong> Dokumen ini merupakan laporan profil dan estimasi kesiapan pajak (Tax Readiness Report) yang dihasilkan secara sistem oleh aplikasi My Tax. 
        Dokumen ini <strong>bukan formulir SPT Tahunan resmi</strong> dan bukan produk dari Direktorat Jenderal Pajak (DJP). 
        Dokumen ini dibuat secara eksklusif untuk membantu Wajib Pajak merangkum data penghasilan, aset, dan kewajiban perpajakannya guna mempermudah proses asistensi, konsultasi, dan pengisian SPT pada portal resmi DJP (Coretax / DJP Online).
      </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </>
  );
}
