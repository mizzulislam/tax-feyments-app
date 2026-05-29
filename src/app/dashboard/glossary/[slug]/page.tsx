import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTaxLearningModule, TAX_LEARNING_MODULES, TaxDifficulty, TaxLearningModule } from '@/data/taxLearningModules';
import { createAdminServerClient } from '@/lib/adminServer';
import { mapTaxModuleRow, TAX_MODULE_CMS_SELECT } from '@/lib/taxModuleCms';
import { CmsTaxModule } from '@/types/taxpayer';

export const dynamic = 'force-dynamic';

const difficultyLabel: Record<TaxDifficulty, string> = {
  dasar: 'Dasar',
  menengah: 'Menengah',
  lanjut: 'Lanjut',
};

const difficultyStyle: Record<TaxDifficulty, string> = {
  dasar: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  menengah: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  lanjut: 'bg-red-500/10 text-red-300 border-red-500/20',
};

const allowedIcons: TaxLearningModule['icon'][] = ['landmark', 'calculator', 'file', 'scale', 'briefcase', 'building', 'home', 'spreadsheet'];

function normalizeCmsModule(module: CmsTaxModule): TaxLearningModule {
  return {
    slug: module.slug,
    title: module.title,
    shortTitle: module.shortTitle,
    description: module.description,
    difficulty: module.difficulty,
    category: module.category as TaxLearningModule['category'],
    status: module.status,
    quizScore: module.quizScore ?? undefined,
    estimatedMinutes: module.estimatedMinutes,
    icon: allowedIcons.includes(module.icon as TaxLearningModule['icon']) ? module.icon as TaxLearningModule['icon'] : 'file',
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
  };
}

async function getCmsModule(slug: string) {
  const client = createAdminServerClient();
  if (!client) return null;

  const { data, error } = await client
    .from('tax_learning_modules')
    .select(TAX_MODULE_CMS_SELECT)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeCmsModule(mapTaxModuleRow(data as Parameters<typeof mapTaxModuleRow>[0]));
}

function ModuleIcon({ type }: { type: TaxLearningModule['icon'] }) {
  const common = 'h-7 w-7';
  const colorMap: Record<TaxLearningModule['icon'], string> = {
    landmark: 'text-pink-400',
    calculator: 'text-indigo-400',
    file: 'text-emerald-400',
    scale: 'text-amber-400',
    briefcase: 'text-blue-400',
    building: 'text-slate-300',
    home: 'text-teal-400',
    spreadsheet: 'text-purple-400',
  };

  if (type === 'calculator') {
    return (
      <svg className={`${common} ${colorMap[type]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2" />
      </svg>
    );
  }

  if (type === 'file' || type === 'spreadsheet') {
    return (
      <svg className={`${common} ${colorMap[type]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 3v5h5M8 13h8M8 17h6" />
      </svg>
    );
  }

  if (type === 'scale') {
    return (
      <svg className={`${common} ${colorMap[type]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18M5 7h14M7 7l-4 7h8L7 7Zm10 0-4 7h8l-4-7Z" />
      </svg>
    );
  }

  if (type === 'home') {
    return (
      <svg className={`${common} ${colorMap[type]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" />
      </svg>
    );
  }

  if (type === 'briefcase') {
    return (
      <svg className={`${common} ${colorMap[type]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1m-9 0h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm-2 6h18" />
      </svg>
    );
  }

  if (type === 'building') {
    return (
      <svg className={`${common} ${colorMap[type]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1" />
      </svg>
    );
  }

  return (
    <svg className={`${common} ${colorMap[type]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21h18M4 10h16M6 10V7l6-4 6 4v3M7 10v8m5-8v8m5-8v8" />
    </svg>
  );
}

function SectionIcon({ type }: { type: 'target' | 'idea' | 'info' | 'check' | 'warning' }) {
  const pathMap = {
    target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    idea: 'M12 3a6 6 0 0 0-3.5 10.87c.63.45.95 1.09.95 1.84V16h5.1v-.29c0-.75.32-1.39.95-1.84A6 6 0 0 0 12 3Zm-2 16h4',
    info: 'M12 9h.01M11 12h1v4h1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    check: 'M9 12.5 11 14.5 15.5 9.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    warning: 'M12 8v4m0 4h.01M10.29 3.86 2.82 17a2 2 0 0 0 1.71 3h14.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
  };

  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={pathMap[type]} />
    </svg>
  );
}

export function generateStaticParams() {
  return TAX_LEARNING_MODULES.map((learningModule) => ({ slug: learningModule.slug }));
}

export default async function GlossaryTopicPage({ params }: PageProps<'/dashboard/glossary/[slug]'>) {
  const { slug } = await params;
  const learningModule = await getCmsModule(slug) || getTaxLearningModule(slug);

  if (!learningModule) {
    notFound();
  }

  const moduleList = TAX_LEARNING_MODULES;
  const currentIndex = Math.max(moduleList.findIndex((item) => item.slug === learningModule.slug), 0);
  const progressRatio = ((currentIndex + 1) / moduleList.length) * 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <Link
        href="/dashboard/glossary"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M19 12H5m6-7-7 7 7 7" />
        </svg>
        Kembali ke Modul Pajak
      </Link>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/45 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex gap-4">
            <div className="h-16 w-16 shrink-0 rounded-2xl border border-slate-800 bg-slate-950/70 flex items-center justify-center">
              <ModuleIcon type={learningModule.icon} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${difficultyStyle[learningModule.difficulty]}`}>
                  {difficultyLabel[learningModule.difficulty]}
                </span>
                <span className="text-xs px-3 py-1 rounded-full font-bold border border-blue-500/20 bg-blue-500/10 text-blue-300">
                  {learningModule.estimatedMinutes} menit
                </span>
                <span className="text-xs px-3 py-1 rounded-full font-bold border border-slate-700 bg-slate-950/60 text-slate-400">
                  {learningModule.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                {learningModule.title}
              </h1>
              <p className="mt-4 text-slate-400 text-base md:text-lg leading-relaxed max-w-3xl">
                {learningModule.description}
              </p>
            </div>
          </div>

          <div className="w-full lg:w-72 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-400">
              <span>Posisi Modul</span>
              <span>{currentIndex + 1} dari {moduleList.length}</span>
            </div>
            <div className="flex gap-1">
              {moduleList.map((item, index) => (
                <div
                  key={item.slug}
                  className={`h-2 flex-1 rounded-full ${index <= currentIndex ? 'bg-blue-500' : 'bg-slate-800'}`}
                />
              ))}
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${progressRatio}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/35 p-6 md:p-8 shadow-xl">
        <p className="text-slate-300 text-lg leading-relaxed">{learningModule.intro}</p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/45 p-6 md:p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-3 text-blue-300">
          <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3">
            <SectionIcon type="check" />
          </div>
          <h2 className="text-xl font-black text-blue-200">Tujuan Belajar</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {learningModule.learningGoals.map((goal) => (
            <div key={goal} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 text-sm font-semibold leading-relaxed text-slate-300">
              {goal}
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 md:p-8 shadow-xl">
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border-[12px] border-emerald-300/10" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-3 text-emerald-300">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3">
              <SectionIcon type="target" />
            </div>
            <h2 className="text-xl font-black text-emerald-200">Inti Konsep</h2>
          </div>
          <p className="text-xl md:text-2xl font-black leading-relaxed text-white">
            {learningModule.coreConcept}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/45 p-6 md:p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-3 text-slate-300">
          <div className="rounded-2xl bg-slate-500/10 border border-slate-700 p-3">
            <SectionIcon type="info" />
          </div>
          <h2 className="text-xl font-black text-white">Poin Penting Materi</h2>
        </div>
        <div className="space-y-3">
          {learningModule.keyPoints.map((point) => (
            <div key={point} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              <p className="text-slate-300 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/45 p-6 md:p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-3 text-indigo-300">
          <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-3">
            <SectionIcon type="idea" />
          </div>
          <h2 className="text-xl font-black text-indigo-200">{learningModule.analogyTitle}</h2>
        </div>
        <p className="text-slate-300 text-lg leading-relaxed">{learningModule.analogy}</p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/45 p-6 md:p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-3 text-blue-300">
          <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3">
            <SectionIcon type="info" />
          </div>
          <h2 className="text-xl font-black text-blue-200">{learningModule.relevanceTitle}</h2>
        </div>
        <p className="text-slate-300 text-lg leading-relaxed">{learningModule.relevance}</p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/45 p-6 md:p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-3 text-amber-300">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3">
            <SectionIcon type="check" />
          </div>
          <h2 className="text-xl font-black text-amber-200">Checklist Praktik</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {learningModule.practicalChecklist.map((item) => (
            <div key={item} className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4 text-sm font-semibold leading-relaxed text-amber-50/90">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/45 p-6 md:p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-3 text-amber-300">
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3">
            <SectionIcon type="check" />
          </div>
          <h2 className="text-xl font-black text-amber-200">Langkah Selanjutnya</h2>
        </div>
        <ol className="space-y-4">
          {learningModule.nextSteps.map((step, index) => (
            <li key={step} className="flex gap-4 text-slate-300 text-lg leading-relaxed">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-sm font-black text-blue-300">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-red-500/25 bg-red-500/10 p-6 md:p-8 shadow-xl flex gap-4">
        <div className="shrink-0 text-red-300">
          <SectionIcon type="warning" />
        </div>
        <div>
          <h2 className="text-lg font-black text-red-200 mb-2">Batasan Penjelasan</h2>
          <p className="text-red-100/90 leading-relaxed">{learningModule.caution}</p>
        </div>
      </section>

      {slug === 'coretax-espt' && (
        <section className="bg-slate-900/60 border border-blue-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="border-l-4 border-blue-500 pl-4 mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Panduan e-Billing & Penafian Penting</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              My Tax hanya menyediakan <strong>draft persiapan pembayaran</strong> dan tidak terhubung dengan sistem e-Billing DJP. 
              Aplikasi ini tidak menerbitkan kode billing, tidak menerima pembayaran, dan tidak menandai pajak sebagai lunas. Pembayaran pajak yang sah hanya dapat dilakukan menggunakan 
              kode billing yang diterbitkan secara resmi oleh DJP.
            </p>
          </div>

          <div className="space-y-8">
            <div className="relative pl-10">
              <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">1</div>
              <h3 className="text-lg font-bold text-white mb-2">Login ke DJP Online</h3>
              <p className="text-slate-400 text-sm">
                Kunjungi situs resmi DJP Online di <a href="https://djponline.pajak.go.id" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline">djponline.pajak.go.id</a>. Masukkan NIK/NPWP, kata sandi, dan kode keamanan.
              </p>
            </div>

            <div className="relative pl-10">
              <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">2</div>
              <h3 className="text-lg font-bold text-white mb-2">Pilih Menu e-Billing</h3>
              <p className="text-slate-400 text-sm mb-3">
                Setelah berhasil masuk, navigasikan ke menu <strong>Bayar</strong> lalu pilih <strong>e-Billing</strong>.
              </p>
            </div>

            <div className="relative pl-10">
              <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">3</div>
              <h3 className="text-lg font-bold text-white mb-2">Isi Form Surat Setoran Elektronik (SSE)</h3>
              <p className="text-slate-400 text-sm mb-4">
                Pilih Jenis Pajak dan Jenis Setoran yang sesuai dengan pajak yang ingin Anda bayarkan. Berikut panduan ringkas untuk SPT Tahunan Orang Pribadi:
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid gap-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400 text-xs uppercase font-bold">Jenis Pajak</span>
                  <span className="text-white font-mono text-sm">411125 - PPh Pasal 25/29 Orang Pribadi</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400 text-xs uppercase font-bold">Jenis Setoran</span>
                  <span className="text-white font-mono text-sm">200 - Tahunan</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs uppercase font-bold">Masa Pajak & Tahun</span>
                  <span className="text-white text-sm">Des - Des | Tahun bersangkutan</span>
                </div>
              </div>
            </div>

            <div className="relative pl-10">
              <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">4</div>
              <h3 className="text-lg font-bold text-white mb-2">Buat Kode Billing Resmi di DJP & Lakukan Pembayaran</h3>
              <p className="text-slate-400 text-sm">
                Klik <strong>Buat Kode Billing</strong>. Anda akan menerima 15 digit angka. Gunakan kode ini untuk membayar melalui ATM, Internet Banking, Mobile Banking, Kantor Pos, atau e-Commerce yang mendukung pembayaran MPN G3.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 italic text-center">
              Pajak yang Anda bayarkan adalah wujud cinta tanah air dan partisipasi langsung dalam pembangunan bangsa.
            </p>
          </div>
        </section>
      )}

      <section className="flex flex-col sm:flex-row justify-between items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900/45 p-5 shadow-xl">
        <Link
          href="/dashboard/glossary"
          className="w-full sm:w-auto text-center px-5 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold transition-colors"
        >
          Nanti Saja
        </Link>
        <Link
          href="/dashboard/assistant"
          className="w-full sm:w-auto text-center px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-lg shadow-blue-500/20 transition-colors"
        >
          Tanya Feyn &rarr;
        </Link>
      </section>
    </div>
  );
}
