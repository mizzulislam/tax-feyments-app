'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TAX_LEARNING_MODULES, TaxLearningModule } from '@/data/taxLearningModules';
import { CmsTaxModule } from '@/types/taxpayer';

type ActivityProfile = {
  fullName: string | null;
  taxpayerType: string | null;
  avatarUrl: string | null;
  occupation: string | null;
  education: string | null;
  domicile: string | null;
  hobbies: string | null;
  createdAt: string | null;
  email: string | null;
};

const difficultyLabel: Record<TaxLearningModule['difficulty'], string> = {
  dasar: 'Dasar',
  menengah: 'Menengah',
  lanjut: 'Lanjut',
};

const statusLabel: Record<TaxLearningModule['status'], string> = {
  belum: 'Belum dimulai',
  sedang: 'Sedang dipelajari',
  selesai: 'Selesai',
};

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 shadow-xl md:rounded-2xl md:p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 md:text-[10px] md:tracking-[0.22em]">{label}</p>
      <p className="mt-1.5 text-2xl font-black leading-none text-white md:mt-3 md:text-3xl">{value}</p>
      <p className="mt-1 text-[10px] font-semibold leading-snug text-slate-400 md:text-xs">{hint}</p>
    </div>
  );
}

function ActivityIcon({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border ${tone}`}>
      {children}
    </div>
  );
}

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
    icon: 'file',
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

async function fetchProfile(): Promise<ActivityProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      fullName: null,
      taxpayerType: null,
      avatarUrl: null,
      occupation: null,
      education: null,
      domicile: null,
      hobbies: null,
      createdAt: null,
      email: null,
    };
  }

  const { data } = await supabase
    .from('profiles')
    .select('full_name, taxpayer_type, avatar_url, occupation, education, domicile, hobbies, created_at')
    .eq('id', user.id)
    .maybeSingle();

  return {
    fullName: data?.full_name ?? null,
    taxpayerType: data?.taxpayer_type ?? null,
    avatarUrl: data?.avatar_url ?? null,
    occupation: data?.occupation ?? null,
    education: data?.education ?? null,
    domicile: data?.domicile ?? null,
    hobbies: data?.hobbies ?? null,
    createdAt: data?.created_at ?? null,
    email: user.email ?? null,
  };
}

async function fetchModules(): Promise<TaxLearningModule[]> {
  const response = await fetch('/api/modules');
  const payload = await response.json().catch(() => ({ items: [] }));
  if (!response.ok || !Array.isArray(payload.items) || payload.items.length === 0) {
    return TAX_LEARNING_MODULES;
  }
  return (payload.items as CmsTaxModule[]).map(normalizeCmsModule);
}

function formatJoinDate(value: string | null) {
  if (!value) return 'Belum tersedia';
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(value));
}

export default function MyProfilePage() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['activity_profile'],
    queryFn: fetchProfile,
  });

  const { data: modules = TAX_LEARNING_MODULES, isLoading: modulesLoading } = useQuery({
    queryKey: ['activity_modules'],
    queryFn: fetchModules,
  });

  const completedModules = modules.filter((moduleItem) => moduleItem.status === 'selesai');
  const activeModules = modules.filter((moduleItem) => moduleItem.status !== 'belum');
  const quizHistory = modules.filter((moduleItem) => typeof moduleItem.quizScore === 'number');
  const totalXp = quizHistory.reduce((total, moduleItem) => total + (moduleItem.quizScore ?? 0), 0);
  const totalPoints = completedModules.length * 100;
  const learningMinutes = activeModules.reduce((total, moduleItem) => total + moduleItem.estimatedMinutes, 0);
  const progressPercent = modules.length > 0 ? Math.round((completedModules.length / modules.length) * 100) : 0;
  const initials = (profile?.fullName || profile?.email || 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (profileLoading || modulesLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500 md:space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-800/80 bg-[#111318] shadow-2xl">
        <div className="relative min-h-[300px] px-6 py-8 md:px-10 lg:px-12">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[radial-gradient(ellipse_at_bottom_right,rgba(37,99,235,0.18),transparent_58%)]" />
          <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-[520px] rounded-full border border-slate-800/50 opacity-40" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-center">
            <div className="flex justify-start lg:w-44 lg:justify-end">
              <div className="relative">
                <div
                  className="flex h-32 w-32 items-center justify-center rounded-full border border-blue-500/25 bg-cover bg-center bg-no-repeat text-3xl font-bold text-blue-100 shadow-2xl shadow-blue-950/25 md:h-40 md:w-40 md:text-4xl"
                  style={profile?.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})` } : undefined}
                >
                  {!profile?.avatarUrl && initials}
                </div>
              </div>
            </div>

            <div className="max-w-4xl flex-1 text-left">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl xl:text-5xl">
                  {profile?.fullName || 'Wajib Pajak'}
                  </h1>
                  <p className="mt-4 text-base font-semibold text-white md:text-lg">
                    {profile?.occupation || 'Fresh Graduate'}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 text-sm font-semibold text-white">
                <div className="flex items-center justify-start gap-2">
                  <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3l1.9 3.86 4.26.62-3.08 3 .73 4.24L12 12.72l-3.81 2 .73-4.24-3.08-3 4.26-.62L12 3z" />
                  </svg>
                  <span>{totalXp} XP</span>
                </div>
                <div className="flex items-center justify-start gap-2">
                  <svg className="h-4 w-4 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>Bergabung sejak {formatJoinDate(profile?.createdAt ?? null)}</span>
                </div>
                <div className="flex items-center justify-start gap-2">
                  <svg className="h-4 w-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21s6-5.686 6-11a6 6 0 1 0-12 0c0 5.314 6 11 6 11Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10.5h.01" />
                  </svg>
                  <span>{profile?.domicile || 'Domisili belum diatur'}</span>
                </div>
              </div>

              <div className="mt-7">
                <h2 className="text-sm font-bold text-white md:text-base">Tentang Saya</h2>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-400">
                  {profile?.hobbies || 'Ringkasan aktivitas akan makin kaya ketika user mulai menyelesaikan modul, quiz, dan memperbarui tentang saya di pengaturan.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
          <StatTile label="Points" value={String(totalPoints)} hint="Dari modul selesai" />
          <StatTile label="XP" value={String(totalXp)} hint="Dari quiz pajak" />
          <StatTile label="Modul" value={`${completedModules.length}/${modules.length}`} hint={`${progressPercent}% progres belajar`} />
          <StatTile label="Durasi" value={`${learningMinutes}m`} hint="Estimasi aktivitas belajar" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-2xl">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-400">Academy</p>
                <h2 className="mt-2 text-2xl font-black text-white">Modul yang Dipelajari</h2>
              </div>
            </div>

            <div className="space-y-4">
              {activeModules.length === 0 ? (
                <p className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 text-sm font-semibold text-slate-400">
                  Belum ada modul yang dipelajari.
                </p>
              ) : (
                activeModules.slice(0, 5).map((moduleItem) => (
                  <Link
                    key={moduleItem.slug}
                    href={`/dashboard/glossary/${moduleItem.slug}`}
                    className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition-all hover:border-blue-500/40 hover:bg-slate-900/70"
                  >
                    <ActivityIcon tone="border-blue-500/20 bg-blue-500/10 text-blue-300">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13M4.5 6.75A8.5 8.5 0 0 1 12 6.253a8.5 8.5 0 0 1 7.5.497v12.5A8.5 8.5 0 0 0 12 18.753a8.5 8.5 0 0 0-7.5.497V6.75Z" />
                      </svg>
                    </ActivityIcon>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-white">{moduleItem.title}</h3>
                        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {difficultyLabel[moduleItem.difficulty]}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">{moduleItem.description}</p>
                      <p className="mt-3 text-xs font-bold text-emerald-300">{statusLabel[moduleItem.status]}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end border-t border-slate-800/70 pt-4">
              <Link href="/dashboard/glossary" className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-black text-blue-300 transition-colors hover:border-blue-400/40 hover:bg-blue-500/15 hover:text-blue-200">
                Lihat Semua
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-400">Quiz Pajak</p>
            <h2 className="mt-2 text-2xl font-black text-white">Riwayat Quiz</h2>
            <div className="mt-5 space-y-3">
              {quizHistory.length === 0 ? (
                <p className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm font-semibold text-slate-400">
                  Belum ada quiz yang selesai.
                </p>
              ) : (
                quizHistory.slice(0, 5).map((moduleItem) => (
                  <div key={moduleItem.slug} className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-white">{moduleItem.shortTitle}</p>
                      <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-black text-blue-300">
                        {moduleItem.quizScore} XP
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{moduleItem.title}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
