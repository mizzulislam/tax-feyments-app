'use client';

import { useMemo, useState } from 'react';
import TaxCalculatorForm, { calculatorOptions, type CalculatorType } from '@/components/TaxCalculatorForm';

type TaxScopeFilter = 'all' | 'central' | 'regional' | 'sanction';
type TaxFamilyFilter = 'all' | 'pph' | 'ppn' | 'stamp';
type TaxSortField = 'name' | 'category' | 'type';
type TaxSortDirection = 'ascending' | 'descending';

const taxOptionMeta: Record<CalculatorType, { scope: Exclude<TaxScopeFilter, 'all'>; family: Exclude<TaxFamilyFilter, 'all'> | 'regional' | 'sanction' }> = {
  pph21: { scope: 'central', family: 'pph' },
  ppn: { scope: 'central', family: 'ppn' },
  ppnbm: { scope: 'central', family: 'ppn' },
  pph23: { scope: 'central', family: 'pph' },
  pphUnifikasi: { scope: 'central', family: 'pph' },
  pphFinal: { scope: 'central', family: 'pph' },
  pph26: { scope: 'central', family: 'pph' },
  pphBadan: { scope: 'central', family: 'pph' },
  bphtb: { scope: 'regional', family: 'regional' },
  pbbP2: { scope: 'regional', family: 'regional' },
  pajakDaerah: { scope: 'regional', family: 'regional' },
  sanksiPajak: { scope: 'sanction', family: 'sanction' },
  beaMeterai: { scope: 'central', family: 'stamp' },
};

const scopeFilterOptions: Array<{ value: TaxScopeFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'central', label: 'Pajak pusat' },
  { value: 'regional', label: 'Pajak daerah' },
  { value: 'sanction', label: 'Sanksi' },
];

const familyFilterOptions: Array<{ value: TaxFamilyFilter; label: string }> = [
  { value: 'all', label: 'Semua jenis' },
  { value: 'pph', label: 'PPh' },
  { value: 'ppn', label: 'PPN/PPnBM' },
  { value: 'stamp', label: 'Bea meterai' },
];

const sortFieldOptions: Array<{ value: TaxSortField; label: string }> = [
  { value: 'name', label: 'Nama' },
  { value: 'category', label: 'Kategori' },
  { value: 'type', label: 'Jenis' },
];

const sortDirectionOptions: Array<{ value: TaxSortDirection; label: string }> = [
  { value: 'ascending', label: 'Ascending' },
  { value: 'descending', label: 'Descending' },
];

const getTaxCategoryLabel = (calculatorType: CalculatorType) => {
  const scope = taxOptionMeta[calculatorType].scope;
  return scopeFilterOptions.find((option) => option.value === scope)?.label ?? '';
};

const getTaxTypeLabel = (calculatorType: CalculatorType) => {
  const family = taxOptionMeta[calculatorType].family;
  if (family === 'regional') return 'Pajak daerah';
  if (family === 'sanction') return 'Sanksi';
  return familyFilterOptions.find((option) => option.value === family)?.label ?? '';
};

function FilterIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M8 5v14m0 0-3-3m3 3 3-3M16 19V5m0 0-3 3m3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function KalkulatorPage() {
  const [calculatorType, setCalculatorType] = useState<CalculatorType>('pph21');
  const [taxScopeFilter, setTaxScopeFilter] = useState<TaxScopeFilter>('all');
  const [taxFamilyFilter, setTaxFamilyFilter] = useState<TaxFamilyFilter>('all');
  const [taxSortField, setTaxSortField] = useState<TaxSortField>('name');
  const [taxSortDirection, setTaxSortDirection] = useState<TaxSortDirection>('ascending');
  const [openMenu, setOpenMenu] = useState<'filter' | 'sort' | null>(null);

  const visibleCalculatorOptions = useMemo(() => {
    const filtered = calculatorOptions.filter((item) => {
      const meta = taxOptionMeta[item.id];
      const matchesScope = taxScopeFilter === 'all' || meta.scope === taxScopeFilter;
      const matchesFamily = taxFamilyFilter === 'all' || meta.family === taxFamilyFilter;

      return matchesScope && matchesFamily;
    });

    return [...filtered].sort((a, b) => {
      const sortValueA = taxSortField === 'category'
        ? getTaxCategoryLabel(a.id)
        : taxSortField === 'type'
          ? getTaxTypeLabel(a.id)
          : a.title;
      const sortValueB = taxSortField === 'category'
        ? getTaxCategoryLabel(b.id)
        : taxSortField === 'type'
          ? getTaxTypeLabel(b.id)
          : b.title;
      const direction = taxSortDirection === 'ascending' ? 1 : -1;
      const primarySort = sortValueA.localeCompare(sortValueB);

      if (primarySort !== 0) return primarySort * direction;
      return a.title.localeCompare(b.title) * direction;
    });
  }, [taxScopeFilter, taxFamilyFilter, taxSortField, taxSortDirection]);

  const selectedScopeLabel = scopeFilterOptions.find((item) => item.value === taxScopeFilter)?.label ?? 'Semua';
  const selectedFamilyLabel = familyFilterOptions.find((item) => item.value === taxFamilyFilter)?.label ?? 'Semua jenis';
  const selectedSortFieldLabel = sortFieldOptions.find((item) => item.value === taxSortField)?.label ?? 'Nama';
  const selectedSortDirectionLabel = sortDirectionOptions.find((item) => item.value === taxSortDirection)?.label ?? 'Ascending';

  return (
    <div className="relative w-full space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="mb-3 text-4xl font-black tracking-tight text-white md:text-5xl">
          Kalkulator Pajak
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">
          Simulasikan pajak pusat, pajak daerah, dan sanksi administrasi dalam satu ruang kerja yang ringkas.
        </p>
      </div>

      <div className="mt-4 grid w-full items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 xl:order-1">
          <TaxCalculatorForm calculatorType={calculatorType} />
        </div>

        <aside className="order-1 space-y-4 xl:order-2">
          <div className="relative overflow-hidden rounded-3xl p-[1px] shadow-2xl shadow-black/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/45 via-indigo-500/10 to-slate-800/40 opacity-70" />
            <div className="relative rounded-[23px] bg-slate-900/85 p-4 backdrop-blur-2xl xl:p-5">
              <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-px bg-gradient-to-b from-blue-400/50 via-slate-700/30 to-transparent xl:block" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tax Matrix</p>
                <h2 className="mt-1 text-lg font-black text-white">Jenis Pajak</h2>
              </div>

              <div className="relative hidden shrink-0 items-center gap-2 md:flex">
                <button
                  type="button"
                  aria-label="Filter jenis pajak"
                  onClick={() => setOpenMenu(openMenu === 'filter' ? null : 'filter')}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                    taxScopeFilter !== 'all' || taxFamilyFilter !== 'all' || openMenu === 'filter'
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-200'
                      : 'border-slate-800 bg-slate-950/45 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <FilterIcon />
                </button>
                <button
                  type="button"
                  aria-label="Sort jenis pajak"
                  onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                    openMenu === 'sort'
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-200'
                      : 'border-slate-800 bg-slate-950/45 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <SortIcon />
                </button>

                {openMenu && (
                  <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl border border-slate-800 bg-slate-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <p className="px-2 pb-2 text-[9px] font-black uppercase tracking-wider text-slate-500">
                      {openMenu === 'filter' ? 'Filter' : 'Sort'}
                    </p>
                    {openMenu === 'filter' ? (
                      <div className="space-y-3">
                        <div>
                          <p className="px-2 pb-1 text-[9px] font-black uppercase tracking-wider text-slate-600">Kategori</p>
                          <div className="space-y-1">
                            {scopeFilterOptions.map((option) => {
                              const active = taxScopeFilter === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setTaxScopeFilter(option.value)}
                                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                                    active
                                      ? 'bg-blue-600 text-white'
                                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                                  }`}
                                >
                                  <span>{option.label}</span>
                                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="border-t border-slate-800/80 pt-2">
                          <p className="px-2 pb-1 text-[9px] font-black uppercase tracking-wider text-slate-600">Jenis</p>
                          <div className="space-y-1">
                            {familyFilterOptions.map((option) => {
                              const active = taxFamilyFilter === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setTaxFamilyFilter(option.value)}
                                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                                    active
                                      ? 'bg-blue-600 text-white'
                                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                                  }`}
                                >
                                  <span>{option.label}</span>
                                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="px-2 pb-1 text-[9px] font-black uppercase tracking-wider text-slate-600">Urutkan berdasarkan</p>
                          <div className="space-y-1">
                            {sortFieldOptions.map((option) => {
                              const active = taxSortField === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setTaxSortField(option.value)}
                                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                                    active
                                      ? 'bg-blue-600 text-white'
                                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                                  }`}
                                >
                                  <span>{option.label}</span>
                                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="border-t border-slate-800/80 pt-2">
                          <p className="px-2 pb-1 text-[9px] font-black uppercase tracking-wider text-slate-600">Arah</p>
                          <div className="space-y-1">
                            {sortDirectionOptions.map((option) => {
                              const active = taxSortDirection === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setTaxSortDirection(option.value);
                                    setOpenMenu(null);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                                    active
                                      ? 'bg-blue-600 text-white'
                                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                                  }`}
                                >
                                  <span>{option.label}</span>
                                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 hidden flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500 md:flex">
              <span className="rounded-full border border-slate-800 bg-slate-950/45 px-2.5 py-1">{selectedScopeLabel}</span>
              <span className="rounded-full border border-slate-800 bg-slate-950/45 px-2.5 py-1">{selectedFamilyLabel}</span>
              <span className="rounded-full border border-slate-800 bg-slate-950/45 px-2.5 py-1">{selectedSortFieldLabel}</span>
              <span className="rounded-full border border-slate-800 bg-slate-950/45 px-2.5 py-1">{selectedSortDirectionLabel}</span>
              <span className="rounded-full border border-slate-800 bg-slate-950/45 px-2.5 py-1">{visibleCalculatorOptions.length} jenis</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 xl:mt-5 xl:block xl:space-y-2.5">
              {visibleCalculatorOptions.map((item) => {
                const active = calculatorType === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    data-tax-tone={item.id}
                    onClick={() => setCalculatorType(item.id)}
                    className={`tax-type-chip relative flex items-center gap-2 overflow-hidden rounded-xl border px-3 py-2 text-left outline-none transition-[background-color,border-color,box-shadow,color] focus-visible:border-blue-400/60 focus-visible:ring-2 focus-visible:ring-blue-500/25 xl:w-full xl:gap-3 xl:rounded-2xl xl:p-3 ${
                      active
                        ? 'tax-type-chip-active border-transparent bg-slate-950/45 text-white xl:border-blue-500/50 xl:bg-blue-500/10 xl:shadow-lg xl:shadow-blue-500/10'
                        : 'border-slate-800/80 bg-slate-950/45 text-slate-400 hover:border-slate-700 hover:bg-slate-900/70 hover:text-slate-200'
                    }`}
                  >
                    <span className={`relative hidden h-9 w-1.5 overflow-hidden rounded-full xl:block ${active ? 'bg-slate-800' : 'bg-slate-700'}`}>
                      {active && (
                        <span className={`absolute inset-x-0 bottom-0 h-full overflow-hidden rounded-full bg-gradient-to-b ${item.tone} will-change-transform animate-[liquid-fill_1.4s_cubic-bezier(0.2,0.8,0.2,1)_forwards]`}>
                          <span className="absolute inset-x-0 top-0 h-1.5 animate-[liquid-wave_1.4s_cubic-bezier(0.2,0.8,0.2,1)_forwards] rounded-full bg-white/25 blur-[0.5px]" />
                          <span className="absolute inset-y-0 left-0 w-full animate-[liquid-shimmer_1.4s_cubic-bezier(0.2,0.8,0.2,1)_forwards] bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 will-change-transform" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black xl:text-sm">{item.title}</span>
                      <span className="mt-0.5 hidden truncate text-[10px] font-semibold text-slate-500 xl:block">{item.subtitle}</span>
                    </span>
                    <span className={`hidden h-2 w-2 rounded-full xl:block ${active ? `bg-gradient-to-br ${item.tone} animate-[liquid-pop_460ms_ease-out_980ms_both] shadow-[0_0_12px_rgba(96,165,250,0.7)]` : 'bg-slate-700'}`} />
                  </button>
                );
              })}
            </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
