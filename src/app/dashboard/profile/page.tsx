'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taxpayerProfileSchema, TaxpayerProfile } from '@/types/taxpayer';
import { useMutateProfile } from '@/hooks/useMutateProfile';
import { supabase } from '@/lib/supabase';
import { useTaxpayerStore } from '@/store/useTaxpayerStore';

type SettingsSection = 'profil' | 'data-pribadi' | 'akun' | 'academy' | 'notifikasi';

type NotificationPrefs = {
  email_notifications: boolean;
  push_notifications: boolean;
  deadline_reminder_days: number;
  quiet_hours_start: string;
  quiet_hours_end: string;
};

type SelectOption = {
  label: string;
  value: string;
};

const inputClass = 'w-full rounded-md border border-slate-700/55 bg-slate-950/40 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/25 placeholder:text-slate-600 disabled:bg-slate-900/70 disabled:text-slate-500';
const labelClass = 'text-sm font-bold text-slate-200';
const helperClass = 'text-xs font-medium leading-relaxed text-slate-500';

function SettingIcon({ type }: { type: SettingsSection }) {
  const common = 'h-5 w-5';
  if (type === 'profil') {
    return <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" /></svg>;
  }
  if (type === 'data-pribadi') {
    return <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6h10M10 12h10M10 18h10M4 6h.01M4 12h.01M4 18h.01" /></svg>;
  }
  if (type === 'akun') {
    return <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.12 3-2.5S13.657 6 12 6 9 7.12 9 8.5 10.343 11 12 11Zm0 2c-3.314 0-6 1.343-6 3v1h12v-1c0-1.657-2.686-3-6-3Z" /></svg>;
  }
  if (type === 'academy') {
    return <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m12 3 9 5-9 5-9-5 9-5Zm-5 8v4c0 1.657 2.239 3 5 3s5-1.343 5-3v-4" /></svg>;
  }
  return <svg className={common} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.16V11a6 6 0 0 0-12 0v3.16a2 2 0 0 1-.6 1.44L4 17h5m6 0a3 3 0 1 1-6 0" /></svg>;
}

function Toggle({
  checked,
  onChange,
  tone = 'blue',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  tone?: 'blue' | 'yellow';
}) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className={`h-6 w-11 rounded-full bg-slate-800 transition peer-checked:${tone === 'yellow' ? 'bg-yellow-600' : 'bg-blue-600'} peer-focus:ring-2 peer-focus:ring-blue-500/30`} />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
    </label>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <div className="mt-5 border-t border-slate-800/60" />
    </>
  );
}

function SliderInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  const progress = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full accent-blue-500 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
      style={{
        background: `linear-gradient(to right, rgb(37 99 235) 0%, rgb(37 99 235) ${progress}%, rgb(30 41 59) ${progress}%, rgb(30 41 59) 100%)`,
      }}
    />
  );
}

function ModernSelect({
  id,
  value,
  placeholder = 'Pilih',
  options,
  open,
  onToggle,
  onChange,
}: {
  id: string;
  value?: string | null;
  placeholder?: string;
  options: SelectOption[];
  open: boolean;
  onToggle: (id: string | null) => void;
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onToggle(open ? null : id)}
        className="group flex w-full items-center justify-between gap-3 rounded-md border border-slate-700/55 bg-slate-950/40 px-3.5 py-2.5 text-left text-sm text-white outline-none transition hover:border-blue-500/50 hover:bg-slate-950/70 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/25"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? 'text-white' : 'text-slate-500'}>{selected?.label || placeholder}</span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-slate-300 transition-transform duration-200 ${open ? 'rotate-180 text-blue-300' : 'group-hover:text-blue-300'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-blue-500/25 bg-slate-950/95 p-1.5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
          <div className="max-h-64 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(59,130,246,0.45)_rgba(15,23,42,0.8)]" role="listbox">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    onToggle(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <span>{option.label}</span>
                  {active && (
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function CalendarDropdown({
  value,
  open,
  viewDate,
  onToggle,
  onClose,
  onViewDateChange,
  onChange,
}: {
  value?: string | null;
  open: boolean;
  viewDate: Date;
  onToggle: () => void;
  onClose: () => void;
  onViewDateChange: (date: Date) => void;
  onChange: (value: string) => void;
}) {
  const [calendarMode, setCalendarMode] = useState<'day' | 'month' | 'year'>('day');
  const selectedDate = value ? new Date(`${value}T00:00:00`) : null;
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(monthStart);
  const yearLabel = String(monthStart.getFullYear());
  const firstGridDate = new Date(monthStart);
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  firstGridDate.setDate(monthStart.getDate() - mondayOffset);

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDate);
    date.setDate(firstGridDate.getDate() + index);
    return date;
  });

  const changeMonth = (offset: number) => {
    onViewDateChange(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const changeCalendarPage = (offset: number) => {
    if (calendarMode === 'year') {
      onViewDateChange(new Date(viewDate.getFullYear() + (offset * 12), viewDate.getMonth(), 1));
      return;
    }

    if (calendarMode === 'month') {
      onViewDateChange(new Date(viewDate.getFullYear() + offset, viewDate.getMonth(), 1));
      return;
    }

    changeMonth(offset);
  };

  const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    index,
    label: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(viewDate.getFullYear(), index, 1)),
  }));
  const yearStart = viewDate.getFullYear() - 5;
  const yearOptions = Array.from({ length: 12 }, (_, index) => yearStart + index);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-3 rounded-md border border-slate-700/55 bg-slate-950/40 px-3.5 py-2.5 text-left text-sm text-white outline-none transition hover:border-blue-500/50 hover:bg-slate-950/70 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/25"
      >
        <span className={value ? 'text-white' : 'text-slate-500'}>{formatDateInput(value) || 'mm/dd/yyyy'}</span>
        <svg className="h-5 w-5 text-white/90 transition group-hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-3 w-[min(88vw,318px)] overflow-hidden rounded-[1.65rem] border border-blue-500/20 bg-[#1c1d24]/95 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-14 -top-16 h-24 rounded-full bg-blue-600/35 blur-2xl" />
          <div className="relative mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeCalendarPage(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-blue-400/45 hover:bg-blue-500/20"
              aria-label="Sebelumnya"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div className="flex items-center gap-1 text-base font-bold text-white">
              <button
                type="button"
                onClick={() => setCalendarMode(calendarMode === 'month' ? 'day' : 'month')}
                className={`rounded-lg px-2 py-1 transition hover:bg-white/10 ${calendarMode === 'month' ? 'bg-blue-500/20 text-blue-200' : ''}`}
              >
                {monthLabel}
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode(calendarMode === 'year' ? 'day' : 'year')}
                className={`rounded-lg px-2 py-1 transition hover:bg-white/10 ${calendarMode === 'year' ? 'bg-blue-500/20 text-blue-200' : ''}`}
              >
                {yearLabel}
              </button>
            </div>
            <button
              type="button"
              onClick={() => changeCalendarPage(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-blue-400/45 hover:bg-blue-500/20"
              aria-label="Berikutnya"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          {calendarMode === 'month' && (
            <div className="relative grid grid-cols-3 gap-2 pb-1">
              {monthOptions.map((month) => {
                const active = month.index === viewDate.getMonth();
                return (
                  <button
                    key={month.index}
                    type="button"
                    onClick={() => {
                      onViewDateChange(new Date(viewDate.getFullYear(), month.index, 1));
                      setCalendarMode('day');
                    }}
                    className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
                      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {month.label}
                  </button>
                );
              })}
            </div>
          )}

          {calendarMode === 'year' && (
            <div className="relative grid grid-cols-3 gap-2 pb-1">
              {yearOptions.map((year) => {
                const active = year === viewDate.getFullYear();
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      onViewDateChange(new Date(year, viewDate.getMonth(), 1));
                      setCalendarMode('month');
                    }}
                    className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
                      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}

          {calendarMode === 'day' && (
            <div className="relative grid grid-cols-7 gap-y-2 text-center">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                <div key={day} className="pb-1 text-[10px] font-black text-slate-500">
                  {day}
                </div>
              ))}
              {days.map((date) => {
                const inMonth = date.getMonth() === viewDate.getMonth();
                const dateValue = toDateValue(date);
                const selected = selectedDate && toDateValue(selectedDate) === dateValue;

                return (
                  <button
                    key={dateValue}
                    type="button"
                    onClick={() => {
                      onChange(dateValue);
                      setCalendarMode('day');
                      onClose();
                    }}
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                      selected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : inMonth
                          ? 'text-white hover:bg-white/10'
                          : 'text-slate-600 hover:bg-white/5'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { mutate, isPending, error: mutationError } = useMutateProfile();
  const setProfile = useTaxpayerStore((state) => state.setProfile);
  const [activeSection, setActiveSection] = useState<SettingsSection>('profil');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMsg, setAccountMsg] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [notifMissing, setNotifMissing] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());
  const aboutEditorRef = useRef<HTMLDivElement | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email_notifications: true,
    push_notifications: false,
    deadline_reminder_days: 3,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<TaxpayerProfile>({
    resolver: zodResolver(taxpayerProfileSchema),
    defaultValues: {
      fullName: '',
      taxpayerType: 'pribadi',
      nik: '',
      npwp: '',
      phoneNumber: '',
      username: '',
      avatarUrl: '',
      headline: '',
      about: '',
      domicile: '',
      birthPlace: '',
      birthDate: '',
      gender: '',
      currentCompany: '',
      skills: '',
      hobbiesActivities: '',
      portfolioUrl: '',
      certificateName: '',
      specializationInterests: '',
      discoverySource: '',
      expectedMaterials: '',
      occupation: '',
      education: 'S1',
      maritalStatus: 'TK',
      dependents: 0,
      hobbies: '',
    },
  });

  const refreshAccountSecurity = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const providers = user?.app_metadata?.providers;
    setGoogleLinked(Array.isArray(providers) && providers.includes('google'));

    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    setMfaEnabled(Boolean(factorsData?.totp?.length));
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setUserEmail(user.email ?? '');
        setNewEmail(user.email ?? '');
        await refreshAccountSecurity();

        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (error) throw error;

        if (data) {
          const loadedBirthDate = data.birth_date || '';
          const profileData: TaxpayerProfile = {
            fullName: data.full_name || '',
            taxpayerType: (data.taxpayer_type as 'pribadi' | 'badan') || 'pribadi',
            nik: data.nik || '',
            npwp: data.npwp || '',
            phoneNumber: data.phone_number || '',
            username: data.username || '',
            avatarUrl: data.avatar_url || '',
            headline: data.headline || data.occupation || '',
            about: data.about || data.hobbies || '',
            domicile: data.domicile || '',
            birthPlace: data.birth_place || '',
            birthDate: loadedBirthDate,
            gender: data.gender || '',
            currentCompany: data.current_company || '',
            skills: data.skills || data.hobbies || '',
            hobbiesActivities: data.hobbies_activities || '',
            portfolioUrl: data.portfolio_url || '',
            certificateName: data.certificate_name || data.full_name || '',
            specializationInterests: data.specialization_interests || '',
            discoverySource: data.discovery_source || '',
            expectedMaterials: data.expected_materials || '',
            occupation: data.occupation || '',
            education: data.education || 'S1',
            maritalStatus: data.marital_status || 'TK',
            dependents: data.dependents !== undefined ? data.dependents : 0,
            hobbies: data.hobbies || '',
          };
          reset(profileData);
          setProfile(profileData);
          if (loadedBirthDate) {
            setCalendarViewDate(new Date(`${loadedBirthDate}T00:00:00`));
          }
        }

        const { data: notifData, error: notifError } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle();
        if (notifError && (notifError.code === '42P01' || notifError.message.includes('Could not find the table'))) {
          setNotifMissing(true);
        } else if (notifData) {
          setPrefs({
            email_notifications: Boolean(notifData.email_notifications),
            push_notifications: Boolean(notifData.push_notifications),
            deadline_reminder_days: Number(notifData.deadline_reminder_days || 3),
            quiet_hours_start: notifData.quiet_hours_start || '22:00',
            quiet_hours_end: notifData.quiet_hours_end || '07:00',
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Kesalahan tidak diketahui';
        console.error('Gagal mengambil data pengaturan:', message);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [refreshAccountSecurity, reset, setProfile]);

  const fullName = useWatch({ control, name: 'fullName' });
  const headline = useWatch({ control, name: 'headline' });
  const avatarUrl = useWatch({ control, name: 'avatarUrl' });
  const about = useWatch({ control, name: 'about' }) || '';
  const taxpayerType = useWatch({ control, name: 'taxpayerType' });
  const gender = useWatch({ control, name: 'gender' }) || '';
  const birthDate = useWatch({ control, name: 'birthDate' }) || '';
  const education = useWatch({ control, name: 'education' }) || '';
  const maritalStatus = useWatch({ control, name: 'maritalStatus' }) || '';
  const discoverySource = useWatch({ control, name: 'discoverySource' }) || '';
  const specializationInterests = useWatch({ control, name: 'specializationInterests' }) || '';
  const selectedSpecializations = specializationInterests
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const initials = (fullName || userEmail || 'WP')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const onSubmit = (data: TaxpayerProfile) => {
    setSuccessMsg(null);
    mutate(
      {
        ...data,
        occupation: data.headline || data.occupation,
        hobbies: data.about || data.hobbiesActivities || data.skills || data.hobbies,
      },
      {
        onSuccess: () => {
          setSuccessMsg('Pengaturan profil berhasil disimpan.');
          setTimeout(() => setSuccessMsg(null), 4000);
        },
      },
    );
  };

  const saveNotifications = async () => {
    setNotifSaving(true);
    setNotifMsg(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Pengguna tidak terautentikasi.');

      if (prefs.push_notifications && typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setPrefs((current) => ({ ...current, push_notifications: false }));
        }
      }

      const { error } = await supabase.from('notification_preferences').upsert(
        {
          user_id: user.id,
          ...prefs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (error) throw error;
      setNotifMissing(false);
      setNotifMsg('Preferensi notifikasi berhasil disimpan.');
      setTimeout(() => setNotifMsg(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan notifikasi.';
      setNotifMsg(message);
    } finally {
      setNotifSaving(false);
    }
  };

  const handleEmailUpdate = async () => {
    const email = newEmail.trim();
    setAccountMsg(null);
    setAccountError(null);

    if (!email) {
      setAccountError('Email baru wajib diisi.');
      return;
    }

    if (email === userEmail) {
      setAccountError('Email baru masih sama dengan email saat ini.');
      return;
    }

    setAccountSaving(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: `${window.location.origin}/dashboard/profile` },
      );
      if (error) throw error;
      setAccountMsg('Link konfirmasi perubahan email sudah dikirim. Perubahan aktif setelah email baru dikonfirmasi.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah email.';
      setAccountError(message);
    } finally {
      setAccountSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setAccountMsg(null);
    setAccountError(null);

    if (newPassword.length < 8) {
      setAccountError('Password baru minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setAccountError('Konfirmasi password baru tidak sama.');
      return;
    }

    setAccountSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setAccountMsg('Password berhasil diperbarui.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah password.';
      setAccountError(message);
    } finally {
      setAccountSaving(false);
    }
  };

  const disableMfa = async () => {
    setAccountMsg(null);
    setAccountError(null);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const factor = data?.totp?.[0] || data?.all?.find((item) => item.factor_type === 'totp');
      if (!factor) {
        setMfaEnabled(false);
        setAccountMsg('Tidak ada faktor 2FA aktif pada akun ini.');
        return;
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (unenrollError) throw unenrollError;

      setMfaEnabled(false);
      setAccountMsg('Two Factor Authentication berhasil dinonaktifkan.');
      await refreshAccountSecurity();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menonaktifkan 2FA.';
      setAccountError(message);
    }
  };

  const handleMfaToggle = (checked: boolean) => {
    if (checked) {
      router.push('/dashboard/profile/mfa');
      return;
    }
    void disableMfa();
  };

  const handleGoogleLink = async () => {
    setAccountMsg(null);
    setAccountError(null);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard/profile`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghubungkan akun Google.';
      if (message.toLowerCase().includes('manual linking is disabled')) {
        setAccountError('Manual identity linking belum diaktifkan di Supabase. Aktifkan Enable Manual Linking di Supabase Dashboard > Authentication > Settings agar akun Google bisa dihubungkan dari halaman ini.');
        return;
      }
      setAccountError(message);
    }
  };

  useEffect(() => {
    if (!aboutEditorRef.current || document.activeElement === aboutEditorRef.current) return;
    aboutEditorRef.current.innerHTML = about;
  }, [about, activeSection]);

  const applyAboutFormat = (command: 'bold' | 'italic' | 'underline') => {
    aboutEditorRef.current?.focus();
    document.execCommand(command);
    setValue('about', aboutEditorRef.current?.innerHTML || '', { shouldDirty: true });
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    if (!file.type.startsWith('image/')) {
      setAvatarError('File harus berupa gambar.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Ukuran foto maksimal 2MB.');
      event.target.value = '';
      return;
    }

    setAvatarUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Pengguna tidak terautentikasi.');

      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data: publicData } = supabase.storage.from('profile-avatars').getPublicUrl(filePath);
      const publicUrl = `${publicData.publicUrl}?v=${Date.now()}`;

      setValue('avatarUrl', publicUrl, { shouldDirty: true });

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengunggah foto profil.';
      setAvatarError(message);
    } finally {
      setAvatarUploading(false);
      event.target.value = '';
    }
  };

  const menuItems: Array<{ id: SettingsSection; label: string }> = [
    { id: 'profil', label: 'Profil' },
    { id: 'data-pribadi', label: 'Data Pribadi' },
    { id: 'akun', label: 'Akun' },
    { id: 'academy', label: 'Academy' },
    { id: 'notifikasi', label: 'Notifikasi' },
  ];

  const specializationOptions = [
    'Audit',
    'Sistem Informasi Akuntansi',
    'Akuntansi Keuangan',
    'Akuntansi Manajemen',
    'Akuntansi Perpajakan',
    'PPh Orang Pribadi',
    'PPh Badan',
    'PPN & PPnBM',
    'Transfer Pricing',
    'Pemeriksaan Pajak',
    'Konsultan Pajak',
    'Coretax & e-Filing',
  ];

  const taxpayerTypeOptions: SelectOption[] = [
    { value: 'pribadi', label: 'Orang Pribadi' },
    { value: 'badan', label: 'Badan / Perusahaan' },
  ];

  const genderOptions: SelectOption[] = [
    { value: 'laki-laki', label: 'Laki-laki' },
    { value: 'perempuan', label: 'Perempuan' },
    { value: 'tidak-menyebutkan', label: 'Memilih untuk tidak menyebutkan' },
  ];

  const educationOptions: SelectOption[] = [
    { value: 'SMA/SMK', label: 'SMA / SMK / Sederajat' },
    { value: 'D3', label: 'Diploma (D3)' },
    { value: 'S1', label: 'Sarjana (S1)' },
    { value: 'S2', label: 'Magister (S2)' },
    { value: 'S3', label: 'Doktor (S3)' },
  ];

  const maritalStatusOptions: SelectOption[] = [
    { value: 'TK', label: 'TK - Belum Kawin' },
    { value: 'K', label: 'K - Kawin' },
  ];

  const discoverySourceOptions: SelectOption[] = [
    { value: 'Teman / Keluarga / Dosen / Referral', label: 'Teman / Keluarga / Dosen / Referral' },
    { value: 'Kampus / Komunitas Pajak', label: 'Kampus / Komunitas Pajak' },
    { value: 'Media Sosial', label: 'Media Sosial' },
    { value: 'Pencarian Google', label: 'Pencarian Google' },
    { value: 'Event / Webinar', label: 'Event / Webinar' },
  ];

  const toggleSpecialization = (value: string) => {
    const next = selectedSpecializations.includes(value)
      ? selectedSpecializations.filter((item) => item !== value)
      : [...selectedSpecializations, value];
    setValue('specializationInterests', next.join(', '), { shouldDirty: true });
  };

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid w-full max-w-7xl grid-cols-[clamp(180px,18vw,230px)_minmax(0,1fr)] gap-[clamp(1.25rem,3vw,3rem)] px-[clamp(1rem,2vw,2rem)] max-[760px]:grid-cols-1 max-[760px]:px-0">
      <aside className="sticky top-28 self-start max-[760px]:static">
        <h1 className="mb-6 text-2xl font-semibold text-white">Pengaturan</h1>
        <nav className="space-y-2 max-[760px]:flex max-[760px]:gap-2 max-[760px]:overflow-x-auto max-[760px]:pb-2">
          {menuItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`relative flex w-full items-center gap-4 py-3 pl-8 pr-3 text-left text-base font-semibold transition max-[760px]:w-auto max-[760px]:shrink-0 max-[760px]:rounded-xl max-[760px]:border max-[760px]:border-slate-800/60 max-[760px]:bg-slate-900/40 max-[760px]:pl-4 max-[760px]:pr-5 ${
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 h-12 w-1 -translate-y-1/2 rounded-full bg-blue-500 max-[760px]:bottom-0 max-[760px]:left-4 max-[760px]:top-auto max-[760px]:h-1 max-[760px]:w-10 max-[760px]:translate-y-0" />}
                <span className={active ? 'text-white' : 'text-slate-500'}><SettingIcon type={item.id} /></span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0">
        {(successMsg || mutationError) && (
          <div className={`mb-5 rounded-xl border p-4 text-sm ${mutationError ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}>
            {mutationError?.message || successMsg}
          </div>
        )}

        <section className="w-full rounded-2xl border border-slate-800/45 bg-slate-900/45 px-[clamp(1.25rem,3vw,3rem)] py-[clamp(1.5rem,3vw,2rem)] shadow-2xl">
          {activeSection === 'profil' && (
            <>
              <SectionHeader title="Profil Pengguna" />
              <div className="mt-6">
                <label className={labelClass}>Foto Diri</label>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div
                    className="flex aspect-square w-full max-w-sm flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-blue-500/25 bg-blue-600/10 bg-cover bg-center text-5xl font-bold text-blue-200 sm:h-20 sm:w-20 sm:max-w-none sm:text-2xl"
                    style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
                  >
                    {!avatarUrl && initials}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                      <label className="inline-flex w-fit cursor-pointer items-center rounded-md bg-slate-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-600">
                        {avatarUploading ? 'Mengunggah...' : 'Pilih Foto'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={avatarUploading}
                        />
                      </label>
                      <p className={helperClass}>
                        Gambar Profile Anda sebaiknya memiliki rasio 1:1<br />
                        dan berukuran tidak lebih dari 2MB.
                      </p>
                    </div>
                    {avatarError && <p className="text-xs font-medium text-red-400">{avatarError}</p>}
                  </div>
                </div>
              </div>
              <input type="hidden" {...register('avatarUrl')} />

              <div className="mt-7 max-w-2xl space-y-5">
                <div className="space-y-2">
                  <label className={labelClass}>Nama Lengkap *</label>
                  <input {...register('fullName')} className={inputClass} />
                  {errors.fullName && <p className="text-xs text-red-400">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Username *</label>
                  <input {...register('username')} placeholder="username" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Email</label>
                  <input value={userEmail} disabled className={inputClass} />
                  <p className={helperClass}>Anda dapat mengubah alamat email melalui menu Akun.</p>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Headline</label>
                  <input {...register('headline')} placeholder="Contoh: Accounting Student" className={inputClass} />
                  <p className={helperClass}>Dapat diisi dengan titel atau jabatan utama Anda.</p>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Tentang Saya</label>
                  <div className="overflow-hidden rounded-md border border-slate-700/55">
                    <div className="flex gap-2 border-b border-slate-700/50 bg-slate-950/60 px-4 py-2 text-sm font-bold text-white">
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyAboutFormat('bold')}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-800"
                        aria-label="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyAboutFormat('italic')}
                        className="flex h-8 w-8 items-center justify-center rounded-md italic hover:bg-slate-800"
                        aria-label="Italic"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyAboutFormat('underline')}
                        className="flex h-8 w-8 items-center justify-center rounded-md underline hover:bg-slate-800"
                        aria-label="Underline"
                      >
                        U
                      </button>
                    </div>
                    <div
                      ref={aboutEditorRef}
                      contentEditable
                      suppressContentEditableWarning
                      role="textbox"
                      aria-label="Tentang Saya"
                      className="min-h-[132px] w-full bg-slate-950/40 px-4 py-3 text-sm text-white outline-none empty:before:text-slate-600 empty:before:content-['Type_something']"
                      onInput={(event) => setValue('about', event.currentTarget.innerHTML, { shouldDirty: true })}
                      onBlur={(event) => setValue('about', event.currentTarget.innerHTML, { shouldDirty: true })}
                    >
                    </div>
                  </div>
                  <input type="hidden" {...register('about')} />
                </div>
              </div>
            </>
          )}

          {activeSection === 'data-pribadi' && (
            <>
              <SectionHeader title="Data Pribadi" />
              <div className="mt-6 max-w-2xl space-y-5">
                <div className="space-y-2">
                  <label className={labelClass}>No. Telepon</label>
                  <input {...register('phoneNumber')} className={`${inputClass} font-mono`} />
                  <p className={helperClass}>Masukkan nomor telepon dengan format 6287802568095.</p>
                  {errors.phoneNumber && <p className="text-xs text-red-400">{errors.phoneNumber.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Jenis Wajib Pajak</label>
                  <ModernSelect
                    id="taxpayerType"
                    value={taxpayerType}
                    options={taxpayerTypeOptions}
                    open={openSelect === 'taxpayerType'}
                    onToggle={setOpenSelect}
                    onChange={(value) => setValue('taxpayerType', value as 'pribadi' | 'badan', { shouldDirty: true })}
                  />
                  {errors.taxpayerType && <p className="text-xs text-red-400">{errors.taxpayerType.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Domisili</label>
                  <input {...register('domicile')} placeholder="Contoh: Kota Bogor" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Tempat Lahir</label>
                  <input {...register('birthPlace')} placeholder="Contoh: Kabupaten Ende" className={inputClass} />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelClass}>Tanggal Lahir</label>
                    <CalendarDropdown
                      value={birthDate}
                      open={calendarOpen}
                      viewDate={calendarViewDate}
                      onToggle={() => setCalendarOpen((current) => !current)}
                      onClose={() => setCalendarOpen(false)}
                      onViewDateChange={setCalendarViewDate}
                      onChange={(value) => {
                        setValue('birthDate', value, { shouldDirty: true });
                        setCalendarViewDate(new Date(`${value}T00:00:00`));
                        setCalendarOpen(false);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                  <label className={labelClass}>Jenis Kelamin</label>
                    <ModernSelect
                      id="gender"
                      value={gender}
                      placeholder="Pilih"
                      options={genderOptions}
                      open={openSelect === 'gender'}
                      onToggle={setOpenSelect}
                      onChange={(value) => setValue('gender', value, { shouldDirty: true })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Pendidikan Terakhir</label>
                  <ModernSelect
                    id="education"
                    value={education}
                    options={educationOptions}
                    open={openSelect === 'education'}
                    onToggle={setOpenSelect}
                    onChange={(value) => setValue('education', value, { shouldDirty: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Pekerjaan/Profesi Saat Ini</label>
                  <input {...register('occupation')} placeholder={headline || 'Contoh: Tax Staff'} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Perusahaan/Institusi Saat Ini</label>
                  <input {...register('currentCompany')} placeholder="Contoh: Universitas / Perusahaan" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Skill yang Dikuasai</label>
                  <input {...register('skills')} placeholder="Contoh: Akuntansi, Excel, PPh 21" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Hobi/Kegiatan</label>
                  <input {...register('hobbiesActivities')} placeholder="Contoh: Traveling, membaca, komunitas pajak" className={inputClass} />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelClass}>NIK</label>
                    <input {...register('nik')} maxLength={16} className={`${inputClass} font-mono tracking-widest`} />
                    {errors.nik && <p className="text-xs text-red-400">{errors.nik.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>NPWP</label>
                    <input {...register('npwp')} maxLength={16} className={`${inputClass} font-mono tracking-widest`} />
                    {errors.npwp && <p className="text-xs text-red-400">{errors.npwp.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelClass}>Status Pernikahan</label>
                    <ModernSelect
                      id="maritalStatus"
                      value={maritalStatus}
                      options={maritalStatusOptions}
                      open={openSelect === 'maritalStatus'}
                      onToggle={setOpenSelect}
                      onChange={(value) => setValue('maritalStatus', value, { shouldDirty: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Jumlah Tanggungan</label>
                    <input type="number" {...register('dependents', { valueAsNumber: true })} min={0} max={10} className={inputClass} />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === 'akun' && (
            <>
              <SectionHeader title="Akun" />
              <div className="mt-6 max-w-2xl space-y-8">
                {accountMsg && (
                  <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-4 text-sm font-medium text-blue-200">
                    {accountMsg}
                  </div>
                )}
                {accountError && (
                  <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-300">
                    {accountError}
                  </div>
                )}
                <div className="space-y-2">
                  <label className={labelClass}>Ubah Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    className={inputClass}
                  />
                  <p className={helperClass}>Supabase akan mengirim link konfirmasi ke email baru. Email saat ini: {userEmail || 'belum tersedia'}.</p>
                  <button
                    type="button"
                    onClick={handleEmailUpdate}
                    disabled={accountSaving}
                    className="mt-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    {accountSaving ? 'Memproses...' : 'Ubah Email'}
                  </button>
                </div>
                <div className="space-y-4">
                  <h3 className={labelClass}>Ubah Password</h3>
                  <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">Isi jika Anda ingin mengubah password.</div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Password baru"
                    className={inputClass}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Konfirmasi password baru"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handlePasswordUpdate}
                    disabled={accountSaving}
                    className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    {accountSaving ? 'Menyimpan...' : 'Simpan Password'}
                  </button>
                </div>
                <div className="space-y-5 border-t border-slate-800/60 pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={labelClass}>Two Factor Authentication</p>
                      <p className={helperClass}>
                        {mfaEnabled ? '2FA sudah aktif untuk akun ini.' : 'Aktifkan dengan aplikasi authenticator seperti Google Authenticator atau Authy.'}
                      </p>
                    </div>
                    <Toggle checked={mfaEnabled} onChange={handleMfaToggle} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-slate-800/60 pt-5">
                  <div>
                    <p className={labelClass}>Hubungkan Akun Google</p>
                    <p className={helperClass}>
                      {googleLinked ? 'Akun Google sudah terhubung.' : 'Gunakan Google sebagai metode login tambahan.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleLink}
                    disabled={googleLinked}
                    className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-60"
                  >
                    {googleLinked ? 'Terhubung' : 'Hubungkan'}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeSection === 'academy' && (
            <>
              <SectionHeader title="Academy" />
              <div className="mt-6 max-w-2xl space-y-8">
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Verifikasi Nama Sertifikat</h3>
                  <div className="border-t border-slate-800/60 pt-4">
                    <label className={labelClass}>Nama Lengkap</label>
                    <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-medium leading-relaxed text-amber-200">
                      Nama Anda akan digunakan pada sertifikat pembelajaran. Jika terdapat kesalahan, ubah nama lengkap melalui menu Profil sebelum menyimpan.
                    </div>
                    <input {...register('certificateName')} className={`${inputClass} mt-4 max-w-md`} placeholder="Nama untuk sertifikat" />
                  </div>
                </section>

                <section className="space-y-4 border-t border-slate-800/60 pt-6">
                  <h3 className="text-lg font-semibold text-white">Penjurusan Perpajakan & Akuntansi</h3>
                  <p className={helperClass}>
                    Pilih penjurusan agar rekomendasi modul pajak, quiz, dan materi akuntansi lebih sesuai dengan arah belajar Anda.
                  </p>
                  <div className="flex flex-wrap gap-2 rounded-md border border-slate-700/55 bg-slate-950/25 p-3">
                    {specializationOptions.map((option) => {
                      const selected = selectedSpecializations.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleSpecialization(option)}
                          className={`rounded-md border px-3 py-2 text-xs font-bold transition ${
                            selected
                              ? 'border-blue-500/80 bg-blue-600 text-white shadow-lg shadow-blue-500/15'
                              : 'border-slate-700/55 bg-slate-900/70 text-slate-300 hover:border-blue-500/50 hover:text-white'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  <p className={helperClass}>Anda bisa memilih lebih dari satu penjurusan.</p>
                </section>

                <section className="space-y-5 border-t border-slate-800/60 pt-6">
                  <div className="space-y-2">
                    <label className={labelClass}>Tahu Tax Feyments dari mana?</label>
                    <ModernSelect
                      id="discoverySource"
                      value={discoverySource}
                      placeholder="Pilih sumber informasi"
                      options={discoverySourceOptions}
                      open={openSelect === 'discoverySource'}
                      onToggle={setOpenSelect}
                      onChange={(value) => setValue('discoverySource', value, { shouldDirty: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Materi yang Diharapkan di Modul Pembelajaran</label>
                    <input {...register('expectedMaterials')} className={inputClass} placeholder="Contoh: audit pajak, rekonsiliasi fiskal, e-faktur" />
                    <p className={helperClass}>Pisahkan dengan tanda koma jika ada lebih dari satu materi.</p>
                  </div>
                </section>
              </div>
            </>
          )}

          {activeSection === 'notifikasi' && (
            <>
              <SectionHeader title="Pengaturan Notifikasi" />
              <div className="mt-6 max-w-2xl space-y-6">
                {notifMissing && (
                  <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                    Tabel notifikasi belum tersedia. Jalankan query SQL yang saya berikan di Supabase SQL Editor.
                  </div>
                )}
                {notifMsg && <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-200">{notifMsg}</div>}
                <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
                  <div>
                    <p className={labelClass}>Push Notifications</p>
                    <p className={helperClass}>Dapatkan notifikasi realtime langsung di desktop/device.</p>
                  </div>
                  <Toggle checked={prefs.push_notifications} onChange={(value) => setPrefs((current) => ({ ...current, push_notifications: value }))} />
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
                  <div>
                    <p className={labelClass}>Email Notifications</p>
                    <p className={helperClass}>Terima rekapitulasi dan insight penting via email.</p>
                  </div>
                  <Toggle checked={prefs.email_notifications} onChange={(value) => setPrefs((current) => ({ ...current, email_notifications: value }))} />
                </div>
                <div className="space-y-3 border-b border-slate-800/60 pb-5">
                  <p className={labelClass}>Smart Deadline Reminder</p>
                  <SliderInput
                    min={1}
                    max={14}
                    value={prefs.deadline_reminder_days}
                    onChange={(value) => setPrefs((current) => ({ ...current, deadline_reminder_days: value }))}
                  />
                  <p className="text-sm font-bold text-blue-300">{prefs.deadline_reminder_days} Hari sebelum deadline</p>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelClass}>Mulai Jam Hening</label>
                    <input type="time" value={prefs.quiet_hours_start} onChange={(event) => setPrefs((current) => ({ ...current, quiet_hours_start: event.target.value }))} className={`${inputClass} [color-scheme:dark]`} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Sampai Jam</label>
                    <input type="time" value={prefs.quiet_hours_end} onChange={(event) => setPrefs((current) => ({ ...current, quiet_hours_end: event.target.value }))} className={`${inputClass} [color-scheme:dark]`} />
                  </div>
                </div>
                <button type="button" onClick={saveNotifications} disabled={notifSaving} className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60">
                  {notifSaving ? 'Menyimpan...' : 'Simpan Preferensi'}
                </button>
              </div>
            </>
          )}

          {!['akun', 'notifikasi'].includes(activeSection) && (
            <div className="mt-8 flex justify-end border-t border-slate-800/60 pt-6">
              <button type="submit" disabled={isPending} className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60">
                {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          )}
        </section>
      </main>
    </form>
  );
}
