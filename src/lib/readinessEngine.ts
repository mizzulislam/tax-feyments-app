import type { TaxReportData } from '@/hooks/useFetchReports';
import type { IncomeSource, TaxDocument, TaxpayerProfile } from '@/types/taxpayer';

export type ReadinessStatus = 'complete' | 'action' | 'warning';

export interface ReadinessItem {
  label: string;
  detail: string;
  href: string;
  status: ReadinessStatus;
  weight: number;
}

export interface ReadinessResult {
  score: number;
  health: 'Aman' | 'Perlu Perhatian' | 'Data Belum Lengkap' | 'Risiko Tinggi';
  taxYear: number;
  mode: 'tahunan' | 'masa';
  title: string;
  deadlineText: string;
  items: ReadinessItem[];
  completedItems: string[];
  missingItems: string[];
  nextActions: string[];
  nextAction: ReadinessItem; // Keep for backward compatibility with panel
}

export function calculateReadiness(input: {
  profile?: TaxpayerProfile | null;
  reports?: TaxReportData[];
  incomeSources?: IncomeSource[];
  documents?: TaxDocument[];
  taxYear?: number;
}): ReadinessResult {
  const taxYear = input.taxYear || new Date().getFullYear();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0 = Jan
  const currentDay = currentDate.getDate();

  const reports = input.reports || [];
  const incomeSources = input.incomeSources || [];
  const documents = input.documents || [];
  const profile = input.profile;

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  let mode: 'tahunan' | 'masa' = 'masa';
  // Jika bulan Februari, Maret, atau April, fokus ke SPT Tahunan
  if (currentMonth === 1 || currentMonth === 2 || currentMonth === 3) {
    mode = 'tahunan';
  }

  let title = '';
  let deadlineText = '';

  if (mode === 'tahunan') {
    title = `Kesiapan SPT ${taxYear}`;
    deadlineText = `31 Maret ${taxYear + 1}`;
    if (profile?.taxpayerType === 'badan') {
      deadlineText = `30 April ${taxYear + 1}`;
    }
  } else {
    const monthYear = `${monthNames[currentMonth]} ${currentDate.getFullYear()}`;
    if (currentDay <= 15) {
      title = `Kesiapan Setor PPh Masa ${monthYear}`;
      deadlineText = `15 ${monthYear}`;
    } else if (currentDay <= 20) {
      title = `Kesiapan Lapor SPT Masa ${monthYear}`;
      deadlineText = `20 ${monthYear}`;
    } else {
      const lastDay = new Date(currentDate.getFullYear(), currentMonth + 1, 0).getDate();
      title = `Kesiapan PPN & PPnBM ${monthYear}`;
      deadlineText = `${lastDay} ${monthYear}`;
    }
  }

  const hasCoreProfile = Boolean(profile?.fullName && profile?.nik && profile?.npwp);
  let items: ReadinessItem[] = [];

  if (mode === 'tahunan') {
    const currentYearIncome = incomeSources.filter((source) => source.taxYear === taxYear);
    const currentYearDocuments = documents.filter((document) => !document.taxYear || document.taxYear === taxYear);
    const currentYearReport = reports.find((report) => report.tax_year === taxYear);
    const reportSubmitted = currentYearReport?.status === 'submitted' || currentYearReport?.status === 'paid';

    items = [
      {
        label: 'Profil WP',
        detail: hasCoreProfile ? 'Identitas utama sudah terisi.' : 'Lengkapi nama, NIK, dan NPWP.',
        href: '/dashboard/profile',
        status: hasCoreProfile ? 'complete' : 'action',
        weight: 25,
      },
      {
        label: 'Penghasilan',
        detail: currentYearIncome.length > 0
          ? `${currentYearIncome.length} sumber penghasilan tahun ${taxYear} tercatat.`
          : `Tambahkan sumber penghasilan tahun ${taxYear}.`,
        href: '/dashboard/income',
        status: currentYearIncome.length > 0 ? 'complete' : 'action',
        weight: 25,
      },
      {
        label: 'Berkas',
        detail: currentYearDocuments.length > 0
          ? `${currentYearDocuments.length} berkas pendukung siap ditinjau.`
          : 'Unggah bukti potong, identitas, atau dokumen pendukung.',
        href: '/dashboard/documents',
        status: currentYearDocuments.length > 0 ? 'complete' : 'warning',
        weight: 25,
      },
      {
        label: 'Laporan',
        detail: reportSubmitted
          ? 'Laporan sudah masuk tahap submitted di aplikasi.'
          : currentYearReport
            ? 'Laporan masih perlu ditinjau sebelum pembayaran/pelaporan resmi.'
            : `Buat simulasi/laporan pajak tahun ${taxYear}.`,
        href: '/dashboard/kalkulator',
        status: reportSubmitted ? 'complete' : currentYearReport ? 'warning' : 'action',
        weight: 25,
      },
    ];
  } else {
    // Mode Masa
    const recentIncome = incomeSources.filter((source) => source.taxYear === taxYear);
    const recentDocuments = documents.filter((doc) => !doc.taxYear || doc.taxYear === taxYear);

    items = [
      {
        label: 'Profil WP',
        detail: hasCoreProfile ? 'Identitas utama sudah terisi.' : 'Lengkapi nama, NIK, dan NPWP.',
        href: '/dashboard/profile',
        status: hasCoreProfile ? 'complete' : 'action',
        weight: 25,
      },
      {
        label: 'Transaksi Masa',
        detail: recentIncome.length > 0
          ? `Terdapat catatan transaksi untuk periode ini.`
          : `Tambahkan catatan penghasilan/transaksi bulan ini.`,
        href: '/dashboard/income',
        status: recentIncome.length > 0 ? 'complete' : 'action',
        weight: 25,
      },
      {
        label: 'Dokumen Masa',
        detail: recentDocuments.length > 0
          ? `Dokumen pendukung masa/bulan ini tersedia.`
          : 'Unggah faktur pajak atau bukti potong PPh Masa.',
        href: '/dashboard/documents',
        status: recentDocuments.length > 0 ? 'complete' : 'warning',
        weight: 25,
      },
      {
        label: 'Status Masa',
        detail: (recentIncome.length > 0 && recentDocuments.length > 0) 
          ? 'Pencatatan masa bulanan sudah rapi.' 
          : 'Cek kewajiban penyetoran PPh Masa atau pelaporan PPN bulan ini.',
        href: '/dashboard/kalkulator',
        status: (recentIncome.length > 0 && recentDocuments.length > 0) ? 'complete' : 'warning',
        weight: 25,
      },
    ];
  }

  const score = Math.round(
    items.reduce((total, item) => total + (item.status === 'complete' ? item.weight : 0), 0)
  );

  let health: 'Aman' | 'Perlu Perhatian' | 'Data Belum Lengkap' | 'Risiko Tinggi' = 'Data Belum Lengkap';
  if (score >= 100) health = 'Aman';
  else if (score >= 75) health = 'Perlu Perhatian';
  else if (score >= 50) health = 'Data Belum Lengkap';
  else health = 'Risiko Tinggi';

  const completedItems = items.filter(i => i.status === 'complete').map(i => i.label);
  const missingItems = items.filter(i => i.status !== 'complete').map(i => i.label);
  const nextActions = items.filter(i => i.status !== 'complete').map(i => i.detail);

  const nextAction = items.find((item) => item.status === 'action') || items.find((item) => item.status === 'warning') || items[0];

  return { score, health, taxYear, mode, title, deadlineText, items, completedItems, missingItems, nextActions, nextAction };
}
