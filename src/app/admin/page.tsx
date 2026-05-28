'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import {
  useAdminDocuments,
  useAdminStats,
  useAdminUsers,
  useAuditLogs,
  useUpdateAdminUserRole,
  useVerifyAdminDocument,
} from '@/hooks/admin/useAdminApi';
import { AdminUser, UserRole } from '@/types/taxpayer';



const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Manajemen User' },
  { id: 'audit', label: 'Audit Trail' },
  { id: 'documents', label: 'Verifikasi Dokumen' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const roles: UserRole[] = ['user', 'consultant', 'admin'];

type RoleChangeRequest = {
  user: AdminUser;
  nextRole: UserRole;
};

function formatNumber(value?: number) {
  return Number(value || 0).toLocaleString('id-ID');
}

function formatRupiah(value?: number) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="bg-slate-900/70 border border-red-500/30 rounded-2xl p-6 space-y-5">
      <div>
        <h3 className="text-lg font-black text-white">Konfigurasi Admin Perlu Dilengkapi</h3>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">{message}</p>
      </div>
      <p className="text-xs text-slate-500">
        Pastikan konfigurasi lingkungan Supabase sudah sesuai dan akses database tersedia.
      </p>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-2">
      <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block">{label}</span>
      <p className="text-2xl lg:text-3xl font-black text-white font-mono">{value}</p>
      <span className="text-[10px] text-slate-400 font-semibold">{hint}</span>
    </div>
  );
}

function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const maxPage = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
      <span>
        Halaman {page} dari {maxPage} - {formatNumber(total)} data
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page <= 1}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40"
        >
          Sebelumnya
        </button>
        <button
          onClick={() => onPageChange(Math.min(page + 1, maxPage))}
          disabled={page >= maxPage}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading, error } = useAdminStats();

  if (isLoading) return <div className="h-64 bg-slate-900/40 rounded-2xl animate-pulse" />;
  if (error) return <ErrorPanel message={(error as Error).message} />;

  const maxTrend = Math.max(...(data?.registrationTrend || []).map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Pengguna" value={formatNumber(data?.totalUsers)} hint="Profil terdaftar" />
        <StatCard label="Total Transaksi" value={formatNumber(data?.totalTransactions)} hint="Seluruh transaksi tercatat" />
        <StatCard label="Total Pajak" value={formatRupiah(data?.totalTaxPayable)} hint="Akumulasi laporan pajak" />
        <StatCard label="Kesehatan Sistem" value={`${formatNumber(data?.systemHealth)}%`} hint={`${formatNumber(data?.criticalAuditEvents)} audit kritis`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6">Tren Registrasi 6 Minggu</h3>
          <div className="h-52 flex items-end gap-3">
            {(data?.registrationTrend || []).map((item) => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-blue-500/80 border border-blue-300/20 min-h-2"
                  style={{ height: `${Math.max((item.count / maxTrend) * 100, 8)}%` }}
                  title={`${item.count} registrasi`}
                />
                <span className="text-[10px] text-slate-500 font-bold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Monitor Cepat</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Audit hari ini</span>
              <span className="font-mono text-white">{formatNumber(data?.auditEventsToday)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Dokumen pending</span>
              <span className="font-mono text-amber-300">{formatNumber(data?.pendingDocuments)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Insiden kritis</span>
              <span className="font-mono text-red-300">{formatNumber(data?.criticalAuditEvents)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [roleChangeRequest, setRoleChangeRequest] = useState<RoleChangeRequest | null>(null);
  const { data, isLoading, error } = useAdminUsers({ page, search, role });
  const updateRole = useUpdateAdminUserRole();

  const handleRoleChange = (user: AdminUser, nextRole: UserRole) => {
    if (user.role === nextRole) return;
    setRoleChangeRequest({ user, nextRole });
  };

  const confirmRoleChange = () => {
    if (!roleChangeRequest) return;

    updateRole.mutate({
      userId: roleChangeRequest.user.id,
      role: roleChangeRequest.nextRole,
    });
    setRoleChangeRequest(null);
  };

  if (error) return <ErrorPanel message={(error as Error).message} />;

  return (
    <>
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Cari nama atau NPWP"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          />
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="">Semua role</option>
            {roles.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">NPWP</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Dibuat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {isLoading ? (
                <tr><td colSpan={4} className="py-10 text-center text-slate-500">Memuat user...</td></tr>
              ) : (data?.items || []).map((user) => (
                <tr key={user.id}>
                  <td className="py-4 pr-4">
                    <div className="font-bold text-white">{user.fullName || 'Tanpa nama'}</div>
                    <div className="text-xs text-slate-500">{user.email || user.id}</div>
                  </td>
                  <td className="py-4 pr-4 font-mono text-slate-300">{user.npwp || '-'}</td>
                  <td className="py-4 pr-4">
                    <select
                      value={user.role}
                      onChange={(event) => handleRoleChange(user, event.target.value as UserRole)}
                      disabled={updateRole.isPending}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    >
                      {roles.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4 pr-4 text-slate-400">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={data?.total || 0} pageSize={data?.pageSize || 20} onPageChange={setPage} />
      </div>

      {roleChangeRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(239,68,68,0.18),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.14),transparent_28%)]" />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-change-title"
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-red-400/20 bg-slate-950/95 shadow-2xl shadow-red-950/40"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300/80 to-transparent" />
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative p-6 md:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 text-red-300 shadow-lg shadow-red-950/30">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-300">Konfirmasi Akses</p>
                  <h3 id="role-change-title" className="mt-2 text-2xl font-black text-white">Ubah role pengguna?</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Perubahan ini langsung memengaruhi hak akses akun di modul pajak, dokumen, dan panel administrasi.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="text-sm font-bold text-white">{roleChangeRequest.user.fullName || 'Tanpa nama'}</div>
                <div className="mt-1 text-xs text-slate-500">{roleChangeRequest.user.email || roleChangeRequest.user.id}</div>
                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <span className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-center text-xs font-black uppercase tracking-wider text-slate-300">
                    {roleChangeRequest.user.role}
                  </span>
                  <svg className="h-4 w-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 7l5 5m0 0-5 5m5-5H6" />
                  </svg>
                  <span className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-center text-xs font-black uppercase tracking-wider text-red-200">
                    {roleChangeRequest.nextRole}
                  </span>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setRoleChangeRequest(null)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  onClick={confirmRoleChange}
                  disabled={updateRole.isPending}
                  className="rounded-xl border border-red-300/30 bg-red-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Konfirmasi Perubahan
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function AuditTab() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', action: '', severity: '', startDate: '', endDate: '' });
  const { data, isLoading, error } = useAuditLogs({ page, ...filters });
  const actions = useMemo(() => ['INSERT', 'UPDATE', 'DELETE', 'ROLE_CHANGE', 'DOCUMENT_APPROVE', 'DOCUMENT_REJECT'], []);

  if (error) return <ErrorPanel message={(error as Error).message} />;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={filters.search}
          onChange={(event) => {
            setFilters((current) => ({ ...current, search: event.target.value }));
            setPage(1);
          }}
          placeholder="Cari email/action"
          className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none"
        />
        <select
          value={filters.action}
          onChange={(event) => {
            setFilters((current) => ({ ...current, action: event.target.value }));
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">Semua action</option>
          {actions.map((action) => <option key={action} value={action}>{action}</option>)}
        </select>
        <select
          value={filters.severity}
          onChange={(event) => {
            setFilters((current) => ({ ...current, severity: event.target.value }));
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">Semua severity</option>
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
          <option value="critical">critical</option>
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={(event) => {
            setFilters((current) => ({ ...current, startDate: event.target.value }));
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none"
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="py-10 text-center text-slate-500">Memuat audit trail...</div>
        ) : (data?.items || []).map((log) => (
          <div key={log.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-white">{log.action}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  log.severity === 'critical' || log.severity === 'error'
                    ? 'text-red-300 border-red-500/30 bg-red-500/10'
                    : log.severity === 'warning'
                      ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                      : 'text-blue-300 border-blue-500/30 bg-blue-500/10'
                }`}>
                  {log.severity}
                </span>
              </div>
              <p className="text-sm text-slate-300 truncate mt-1">
                {log.actorEmail || 'system'} {'->'} {log.targetTable || '-'} {log.targetId ? `(${log.targetId})` : ''}
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">{formatDate(log.createdAt)}</span>
          </div>
        ))}
      </div>

      <Pagination page={page} total={data?.total || 0} pageSize={data?.pageSize || 20} onPageChange={setPage} />
    </div>
  );
}

function DocumentsTab() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const { data, isLoading, error } = useAdminDocuments({ page, status });
  const verifyDocument = useVerifyAdminDocument();

  if (error) return <ErrorPanel message={(error as Error).message} />;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-5">
      <div className="flex justify-between gap-3">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Dokumen Verifikasi</h3>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none"
        >
          <option value="pending">Pending</option>
          <option value="verified">Terverifikasi</option>
          <option value="all">Semua</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-10 text-center text-slate-500">Memuat dokumen...</div>
        ) : (data?.items || []).map((doc) => (
          <div key={doc.id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <div className="text-sm font-bold text-white line-clamp-2">{doc.fileName}</div>
              <div className="text-xs text-slate-500 mt-1">{doc.ownerName || doc.userId}</div>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-bold">
              <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">{doc.category}</span>
              <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">{doc.taxYear || '-'}</span>
              <span className={`px-2 py-1 rounded-md border ${doc.isVerified ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>
                {doc.isVerified ? 'verified' : 'pending'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => verifyDocument.mutate({ documentId: doc.id, isVerified: true })}
                disabled={verifyDocument.isPending || doc.isVerified}
                className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-bold disabled:opacity-40"
              >
                Approve
              </button>
              <button
                onClick={() => verifyDocument.mutate({ documentId: doc.id, isVerified: false })}
                disabled={verifyDocument.isPending || !doc.isVerified}
                className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 text-xs font-bold disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} total={data?.total || 0} pageSize={data?.pageSize || 20} onPageChange={setPage} />
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-slate-950 text-slate-50 relative flex overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/4 -right-1/4 w-[900px] h-[900px] rounded-full bg-red-600/5 blur-[150px]" />
          <div className="absolute bottom-1/4 -left-1/4 w-[760px] h-[760px] rounded-full bg-blue-600/5 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-10 lg:px-16 w-full space-y-8 animate-in fade-in duration-500">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-900 pb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-wider uppercase mb-3 shadow-inner">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                Admin Panel Fungsional
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                Sistem <span className="text-red-500">Administration</span>
              </h1>
              <p className="text-slate-400 max-w-2xl text-md mt-2">
                Kelola user, pantau audit trail, verifikasi dokumen, dan lihat statistik sistem berbasis data Supabase real.
              </p>
            </div>

            <Link
              href="/admin/modules"
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-all font-semibold text-xs uppercase tracking-wider self-start sm:self-center shadow-lg"
            >
              CMS Modul Pajak
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-all font-semibold text-xs uppercase tracking-wider self-start sm:self-center shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Kembali ke Dasbor
            </Link>
          </header>

          <nav className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider border whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/10'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'audit' && <AuditTab />}
          {activeTab === 'documents' && <DocumentsTab />}
        </div>
      </div>
    </RoleGuard>
  );
}
