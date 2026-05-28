'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { useAdminModules, useDeleteAdminModule, useSaveAdminModule, useSeedAdminModules } from '@/hooks/admin/useAdminApi';
import { CmsTaxModule, CmsTaxModuleInput } from '@/types/taxpayer';
import { useAlert } from '@/contexts/AlertContext';



const emptyForm: CmsTaxModuleInput = {
  slug: '',
  title: '',
  shortTitle: '',
  description: '',
  difficulty: 'dasar',
  category: 'PPh',
  status: 'belum',
  quizScore: null,
  estimatedMinutes: 10,
  icon: 'file',
  intro: '',
  learningGoals: [],
  coreConcept: '',
  keyPoints: [],
  analogyTitle: 'Analogi',
  analogy: '',
  relevanceTitle: 'Relevansi Praktis',
  relevance: '',
  practicalChecklist: [],
  nextSteps: [],
  caution: '',
  isPublished: false,
  orderIndex: 0,
};

function toLines(items: string[]) {
  return items.join('\n');
}

function fromLines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function moduleToForm(module: CmsTaxModule): CmsTaxModuleInput {
  return {
    slug: module.slug,
    title: module.title,
    shortTitle: module.shortTitle,
    description: module.description,
    difficulty: module.difficulty,
    category: module.category,
    status: module.status,
    quizScore: module.quizScore,
    estimatedMinutes: module.estimatedMinutes,
    icon: module.icon,
    intro: module.intro,
    learningGoals: module.learningGoals,
    coreConcept: module.coreConcept,
    keyPoints: module.keyPoints,
    analogyTitle: module.analogyTitle,
    analogy: module.analogy,
    relevanceTitle: module.relevanceTitle,
    relevance: module.relevance,
    practicalChecklist: module.practicalChecklist,
    nextSteps: module.nextSteps,
    caution: module.caution,
    isPublished: module.isPublished,
    orderIndex: module.orderIndex,
  };
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition-colors focus:border-blue-500"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold leading-relaxed text-white outline-none transition-colors focus:border-blue-500"
      />
    </label>
  );
}

export default function AdminModulesPage() {
  const { showConfirm } = useAlert();
  const { data, isLoading, error } = useAdminModules();
  const saveModule = useSaveAdminModule();
  const deleteModule = useDeleteAdminModule();
  const seedModules = useSeedAdminModules();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CmsTaxModuleInput>(emptyForm);
  const [copied, setCopied] = useState(false);

  const modules = useMemo(() => data?.items || [], [data?.items]);
  const selectedModule = useMemo(() => modules.find((item) => item.id === editingId) || null, [editingId, modules]);

  const updateForm = <K extends keyof CmsTaxModuleInput>(key: K, value: CmsTaxModuleInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveModule.mutate(
      { ...form, id: editingId || undefined },
      {
        onSuccess: () => resetForm(),
      }
    );
  };

  const handleEdit = (module: CmsTaxModule) => {
    setEditingId(module.id);
    setForm(moduleToForm(module));
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
          <header className="flex flex-col gap-5 border-b border-slate-900 pb-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-300">
                Hybrid CMS
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                CMS <span className="text-blue-500">Modul Pajak</span>
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                Kurasi materi utama di Supabase agar halaman Modul Pajak tidak perlu memanggil AI untuk konten statis. AI tetap bisa dipakai untuk tanya jawab, ringkasan, dan analogi tambahan.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/admin" className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-300 transition-colors hover:bg-slate-800">
                Admin Panel
              </Link>
              <Link href="/dashboard/glossary" className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-blue-500">
                Lihat Modul
              </Link>
            </div>
          </header>



          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/45 p-5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Daftar Modul CMS</h2>
                  <p className="text-xs text-slate-500">{modules.length} modul tersimpan</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => seedModules.mutate()}
                    disabled={seedModules.isPending}
                    className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300 hover:border-blue-500/50 disabled:opacity-50"
                  >
                    {seedModules.isPending ? 'Import...' : 'Import 13'}
                  </button>
                  <button onClick={resetForm} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 hover:border-blue-500/50">
                    Baru
                  </button>
                </div>
              </div>

              <div className="max-h-[720px] space-y-3 overflow-auto pr-1">
                {isLoading ? (
                  <div className="rounded-2xl bg-slate-950/60 p-6 text-center text-sm text-slate-500">Memuat modul...</div>
                ) : modules.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center text-sm text-slate-500">
                    Belum ada modul CMS. Buat modul pertama dari form di kanan.
                  </div>
                ) : modules.map((module) => (
                  <div key={module.id} className={`rounded-2xl border p-4 transition-colors ${editingId === module.id ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-800 bg-slate-950/50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${module.isPublished ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                            {module.isPublished ? 'Published' : 'Draft'}
                          </span>
                          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-blue-300">{module.difficulty}</span>
                        </div>
                        <h3 className="mt-3 text-sm font-black text-white">{module.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">{module.slug}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => handleEdit(module)} className="flex-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (await showConfirm('Hapus Modul', `Hapus modul "${module.title}"?`, 'Ya, Hapus', 'Batal')) deleteModule.mutate(module.id);
                        }}
                        disabled={deleteModule.isPending}
                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/45 p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h2 className="text-lg font-black text-white">{selectedModule ? 'Edit Modul' : 'Tambah Modul'}</h2>
                  <p className="text-xs text-slate-500">Satu baris per poin untuk field berbentuk daftar.</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(event) => updateForm('isPublished', event.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  Publish
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Judul" value={form.title} onChange={(value) => updateForm('title', value)} placeholder="PPh Orang Pribadi" />
                <TextInput label="Slug" value={form.slug} onChange={(value) => updateForm('slug', value)} placeholder="pph-orang-pribadi" />
                <TextInput label="Judul Pendek" value={form.shortTitle} onChange={(value) => updateForm('shortTitle', value)} placeholder="PPh OP" />
                <TextInput label="Kategori" value={form.category} onChange={(value) => updateForm('category', value)} placeholder="PPh" />
                <label className="space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Tingkat</span>
                  <select
                    value={form.difficulty}
                    onChange={(event) => updateForm('difficulty', event.target.value as CmsTaxModuleInput['difficulty'])}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
                  >
                    <option value="dasar">Dasar</option>
                    <option value="menengah">Menengah</option>
                    <option value="lanjut">Lanjut</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Status Belajar</span>
                  <select
                    value={form.status}
                    onChange={(event) => updateForm('status', event.target.value as CmsTaxModuleInput['status'])}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
                  >
                    <option value="belum">Belum</option>
                    <option value="sedang">Sedang</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </label>
                <TextInput label="Icon" value={form.icon} onChange={(value) => updateForm('icon', value)} placeholder="file, scale, calculator" />
                <TextInput label="Urutan" value={String(form.orderIndex)} onChange={(value) => updateForm('orderIndex', Number(value || 0))} />
                <TextInput label="Estimasi Menit" value={String(form.estimatedMinutes)} onChange={(value) => updateForm('estimatedMinutes', Number(value || 1))} />
              </div>

              <TextArea label="Deskripsi Card" value={form.description} onChange={(value) => updateForm('description', value)} rows={3} />
              <TextArea label="Intro Materi" value={form.intro} onChange={(value) => updateForm('intro', value)} rows={4} />
              <TextArea label="Tujuan Belajar" value={toLines(form.learningGoals)} onChange={(value) => updateForm('learningGoals', fromLines(value))} rows={5} />
              <TextArea label="Inti Konsep" value={form.coreConcept} onChange={(value) => updateForm('coreConcept', value)} rows={4} />
              <TextArea label="Poin Penting Materi" value={toLines(form.keyPoints)} onChange={(value) => updateForm('keyPoints', fromLines(value))} rows={6} />
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Judul Analogi" value={form.analogyTitle} onChange={(value) => updateForm('analogyTitle', value)} />
                <TextInput label="Judul Relevansi" value={form.relevanceTitle} onChange={(value) => updateForm('relevanceTitle', value)} />
              </div>
              <TextArea label="Analogi" value={form.analogy} onChange={(value) => updateForm('analogy', value)} rows={4} />
              <TextArea label="Relevansi Praktis" value={form.relevance} onChange={(value) => updateForm('relevance', value)} rows={4} />
              <TextArea label="Checklist Praktik" value={toLines(form.practicalChecklist)} onChange={(value) => updateForm('practicalChecklist', fromLines(value))} rows={5} />
              <TextArea label="Langkah Selanjutnya" value={toLines(form.nextSteps)} onChange={(value) => updateForm('nextSteps', fromLines(value))} rows={5} />
              <TextArea label="Batasan Penjelasan" value={form.caution} onChange={(value) => updateForm('caution', value)} rows={3} />

              <div className="flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row">
                <button
                  type="submit"
                  disabled={saveModule.isPending}
                  className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-500 disabled:opacity-50"
                >
                  {saveModule.isPending ? 'Menyimpan...' : selectedModule ? 'Simpan Perubahan' : 'Tambah Modul'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-wider text-slate-300 hover:bg-slate-900"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
