'use client';

import { useDemoStore } from '@/store/useDemoStore';
import Link from 'next/link';

export default function ExportReportButton() {
  const { isDemoMode } = useDemoStore();
  
  return (
    <Link 
      href="/report/print"
      target="_blank"
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold shadow-lg transition-colors border border-slate-700"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      Unduh PDF Report {isDemoMode ? '(Demo)' : ''}
    </Link>
  );
}
