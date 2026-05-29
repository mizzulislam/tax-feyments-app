'use client';

import Link from 'next/link';
import { calculateReadiness, ReadinessStatus, ReadinessResult } from '@/lib/readinessEngine';
import type { TaxReportData } from '@/hooks/useFetchReports';
import { useFetchDocuments } from '@/hooks/useDocuments';
import { useFetchIncomeSources } from '@/hooks/useIncomeSources';
import { useTaxpayerStore } from '@/store/useTaxpayerStore';
import { useDemoStore } from '@/store/useDemoStore';
import ExportReportButton from '@/components/dashboard/ExportReportButton';
import DemoCompletionModal from '@/components/dashboard/DemoCompletionModal';
import { useEffect, useState } from 'react';

function getHealthBadgeColor(health: string) {
  switch(health) {
    case 'Aman': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'Perlu Perhatian': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'Risiko Tinggi': return 'bg-red-500/10 text-red-400 border-red-500/20';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
}

export default function ReadinessPanel({ reports }: { reports: TaxReportData[] }) {
  const profile = useTaxpayerStore((state) => state.profile);
  const taxYear = new Date().getFullYear();
  const { data: incomeSources } = useFetchIncomeSources(taxYear);
  const { data: documents } = useFetchDocuments(undefined, taxYear);
  
  const { isDemoMode, demoProfile, demoDeadline } = useDemoStore();
  const [mounted, setMounted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const readiness = calculateReadiness({
    profile: isDemoMode ? demoProfile || profile : profile,
    reports,
    incomeSources: incomeSources || [],
    documents: documents || [],
    taxYear,
  });

  // Watch for Demo Completion
  useEffect(() => {
    if (isDemoMode && readiness.score >= 100) {
      // Small delay to let the user see the 100% animation first
      const timer = setTimeout(() => setShowCompletionModal(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setShowCompletionModal(false);
    }
  }, [isDemoMode, readiness.score]);

  const totalDraftPayable = reports.filter((report) => report.status === 'draft').reduce((sum, current) => sum + current.tax_payable, 0);

  const deadlineStr = isDemoMode ? demoDeadline : readiness.deadlineText;

  let insightMessage = '';
  if (readiness.score >= 100) {
    insightMessage = "Profil pajak Anda terverifikasi lengkap. Anda berada dalam posisi optimal untuk pelaporan resmi ke DJP tanpa risiko denda.";
  } else if (readiness.missingItems.length > 0) {
    const itemsList = readiness.missingItems.join(", ");
    insightMessage = `Sistem mendeteksi Anda belum melengkapi: ${itemsList}. Komponen ini esensial untuk mengkalkulasi kewajiban pajak Anda secara presisi dan mencegah potensi denda.`;
  } else {
    insightMessage = "Lengkapi parameter yang tersisa untuk meningkatkan akurasi simulasi pajak Anda.";
  }

  const circleRadius = 40;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = mounted ? circleCircumference - (circleCircumference * Math.min(100, Math.max(0, readiness.score))) / 100 : circleCircumference;

  const actionText = readiness.nextActions.length > 0 ? readiness.nextActions[0] : '';
  let nextActionLink = readiness.nextAction.href;

  return (
    <section className="relative w-full rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 shadow-xl overflow-hidden">
      
      <DemoCompletionModal isOpen={showCompletionModal} />

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none transform translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none transform -translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 lg:gap-8 w-full">
            <div className="flex flex-col items-center gap-4 flex-shrink-0 mt-1">
              <div className="relative flex items-center justify-center w-24 h-24">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={circleRadius} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-800" />
                  <circle 
                    cx="50" cy="50" r={circleRadius} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    strokeDasharray={circleCircumference} 
                    strokeDashoffset={strokeDashoffset} 
                    className={`transition-all duration-1000 ease-out ${readiness.score >= 80 ? 'text-emerald-500' : readiness.score >= 50 ? 'text-blue-500' : 'text-amber-500'}`} 
                    strokeLinecap="round" 
                  />
                </svg>
                
                <span className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">
                  {Math.round(readiness.score)}
                </span>
              </div>
              
              <span className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-full border bg-slate-950/80 shadow-md whitespace-nowrap ${getHealthBadgeColor(readiness.health)}`}>
                {readiness.health}
              </span>
            </div>

            <div className="flex flex-col items-center sm:items-start text-center sm:text-left mt-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">{readiness.title}</h2>
              </div>
              <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
                Pusat kendali kesiapan data pajak Anda. Pantau kelengkapan dokumen secara real-time sebelum pelaporan resmi ke DJP.
              </p>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Estimasi Kewajiban</span>
                  <span className="text-lg font-bold text-orange-400">Rp {totalDraftPayable.toLocaleString('id-ID')}</span>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Batas Waktu</span>
                  <span className="text-lg font-bold text-red-400">{deadlineStr}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto flex justify-center lg:justify-end mt-2 lg:mt-0 flex-shrink-0">
            <ExportReportButton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const isComplete = readiness.missingItems.length === 0;
            return (
              <>
                <div className={`p-5 rounded-2xl bg-slate-950/40 border transition-colors ${isComplete ? 'border-emerald-500/20 hover:border-emerald-500/30' : 'border-slate-800 hover:border-slate-700'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isComplete ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {isComplete ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white">{isComplete ? 'Status Kelengkapan' : 'Perlu Dilengkapi'}</h3>
                  </div>
                  
                  <ul className="space-y-2.5 mt-2 ml-1">
                    {!isComplete ? (
                      readiness.missingItems.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2.5 text-sm text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)] flex-shrink-0"></div>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-white leading-relaxed">
                        Seluruh data profil Wajib Pajak dan dokumen administrasi Anda telah terverifikasi lengkap.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      </div>
                      <h3 className="text-sm font-bold text-white">Langkah Selanjutnya</h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mt-2 ml-1">
                      {isComplete ? 'Kesiapan Anda sudah 100%. Silakan lanjutkan pelaporan resmi melalui Coretax.' : (actionText || 'Profil Anda siap untuk pelaporan akhir SPT.')}
                    </p>
                  </div>
                  
                  {isComplete ? (
                    <a
                      href="https://coretaxdjp.pajak.go.id/identityproviderportal/Account/Login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-amber-500/20"
                    >
                      Buka Coretax
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  ) : nextActionLink !== '#' ? (
                    <Link
                      href={nextActionLink}
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                    >
                      Lakukan Sekarang
                    </Link>
                  ) : null}
                </div>
              </>
            );
          })()}

          <div className="p-5 rounded-2xl bg-slate-950/40 border border-purple-500/20 hover:border-purple-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <h3 className="text-sm font-bold text-white">AI Insight</h3>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed italic ml-1">
              "{insightMessage}"
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
