'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import NotificationCenter from '@/components/NotificationCenter';
import StreakCounter from '@/components/StreakCounter';
import { useTaxpayerStore } from '@/store/useTaxpayerStore';
import { useQueryClient } from '@tanstack/react-query';
import TaxAssistantChat from '@/components/TaxAssistantChat';
import TourGuide from '@/components/TourGuide';
import { useGamification } from '@/hooks/useGamification';
import { useDemoStore } from '@/store/useDemoStore';
import { decrypt } from '@/lib/encryption';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userEmail: string | null;
  userName: string | null;
  userHandle?: string | null;
  avatarUrl: string | null;
}

type NavChild = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

type NavItem = {
  name: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavChild[];
};

export default function DashboardShell({ children, userEmail, userName, userHandle, avatarUrl }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const clearStore = useTaxpayerStore((state) => state.clearStore);
  const storeProfile = useTaxpayerStore((state) => state.profile);
  const { data: gamification } = useGamification();
  const { isDemoMode, persona } = useDemoStore();
  
  const displayUserName = storeProfile?.fullName || userName;
  const displayUserHandle = storeProfile?.username || userHandle;
  const displayAvatarUrl = storeProfile?.avatarUrl || avatarUrl;
  const educationPoints = gamification?.points || 0;
  const educationLevel = Math.max(1, Math.floor(educationPoints / 250) + 1);

  const [sidebarOpen, setSidebarOpen] = useState(false); // Untuk Drawer Mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Untuk Minimize Desktop
  const [sidebarContentHidden, setSidebarContentHidden] = useState(true);
  const [sidebarClosing, setSidebarClosing] = useState(false);
  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>({});
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [canHoverPointer, setCanHoverPointer] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const sidebarCollapseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapsedItemClass = 'mx-auto flex h-11 w-11 items-center justify-center rounded-2xl p-0 [&_svg]:h-[18px] [&_svg]:w-[18px]';
  const sidebarMotionClass = 'duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-0 motion-reduce:transition-none';
  const sidebarCloseMotionClass = 'duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-0 motion-reduce:transition-none';
  const sidebarItemMotionClass = `${sidebarClosing ? 'duration-[160ms]' : 'duration-300'} ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-0 motion-reduce:transition-none`;
  const sidebarPanelMotionClass = sidebarClosing ? sidebarCloseMotionClass : sidebarMotionClass;

  useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updatePointerMode = () => setCanHoverPointer(hoverQuery.matches);

    updatePointerMode();
    hoverQuery.addEventListener('change', updatePointerMode);

    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      hoverQuery.removeEventListener('change', updatePointerMode);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const effectiveCollapsed = isMobile ? false : sidebarCollapsed;
  const effectiveContentHidden = isMobile ? false : sidebarContentHidden;

  useEffect(() => {
    if (!profileDropdownOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!profileDropdownRef.current?.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [profileDropdownOpen]);

  useEffect(() => {
    setProfileDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (sidebarCollapseTimeoutRef.current) {
        clearTimeout(sidebarCollapseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadProfileIfNeeded = async () => {
      if (storeProfile || isDemoMode) return;
      useTaxpayerStore.getState().setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          useTaxpayerStore.getState().setIsLoading(false);
          return;
        }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          let nikDecrypted = profile.nik || '';
          if (profile.nik_encrypted) {
            nikDecrypted = decrypt(profile.nik_encrypted) || nikDecrypted;
          }

          let npwpDecrypted = profile.npwp || '';
          if (profile.npwp_encrypted) {
            npwpDecrypted = decrypt(profile.npwp_encrypted) || npwpDecrypted;
          }

          useTaxpayerStore.getState().setProfile({
            fullName: profile.full_name || '',
            taxpayerType: (profile.taxpayer_type as 'pribadi' | 'badan') || 'pribadi',
            nik: nikDecrypted,
            npwp: npwpDecrypted,
            phoneNumber: profile.phone_number || '',
            username: profile.username || '',
            avatarUrl: profile.avatar_url || '',
            headline: profile.headline || profile.occupation || '',
            about: profile.about || profile.hobbies || '',
            domicile: profile.domicile || '',
            birthPlace: profile.birth_place || '',
            birthDate: profile.birth_date ? String(profile.birth_date) : '',
            gender: profile.gender || '',
            currentCompany: profile.current_company || '',
            skills: profile.skills || profile.hobbies || '',
            hobbiesActivities: profile.hobbies_activities || '',
            portfolioUrl: profile.portfolio_url || '',
            certificateName: profile.certificate_name || profile.full_name || '',
            specializationInterests: profile.specialization_interests || '',
            discoverySource: profile.discovery_source || '',
            expectedMaterials: profile.expected_materials || '',
            occupation: profile.occupation || '',
            education: profile.education || 'S1',
            maritalStatus: profile.marital_status || 'TK',
            dependents: profile.dependents !== undefined ? profile.dependents : 0,
            hobbies: profile.hobbies || '',
            role: profile.role || 'user',
          });
          useTaxpayerStore.getState().setIsLoading(false);
        } else {
          useTaxpayerStore.getState().setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to auto-load profile in shell:', err);
        useTaxpayerStore.getState().setIsLoading(false);
      }
    };
    loadProfileIfNeeded();
  }, [storeProfile, isDemoMode]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearStore();
    queryClient.clear();
    router.replace('/');
  };

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z"></path></svg>
      )
    },
    {
      name: 'Manajemen Aset',
      href: '/dashboard/assets',
      icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>,
    },
    {
      name: 'Penghasilan & Transaksi',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      ),
      children: [
        {
          name: 'Multi-Penghasilan',
          href: '/dashboard/income',
          icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
        },
        {
          name: 'Transaksi Digital',
          href: '/dashboard/transactions',
          icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>,
        },
      ],
    },
    {
      name: 'Manajemen Dokumen',
      href: '/dashboard/documents',
      icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>,
    },
    {
      name: 'Simulasi What-If',
      href: '/dashboard/what-if',
      icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"></path></svg>,
    },
    {
      name: 'Edukasi Perpajakan',
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
      ),
      children: [
        {
          name: 'Modul Pajak',
          href: '/dashboard/glossary',
          icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>,
        },
        {
          name: 'Kalkulator Pajak',
          href: '/dashboard/kalkulator',
          icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>,
        },
        {
          name: 'Tax Feyments - AI Pajak',
          href: '/dashboard/assistant',
          icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>,
        },
      ],
    }
  ];

  const isGroupActive = (item: NavItem) => {
    if (item.href) return pathname === item.href;
    return item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`)) ?? false;
  };

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen((current) => !current);
      return;
    }

    if (sidebarCollapseTimeoutRef.current) {
      clearTimeout(sidebarCollapseTimeoutRef.current);
      sidebarCollapseTimeoutRef.current = null;
    }
    setSidebarClosing(false);

    if (sidebarCollapsed || sidebarContentHidden) {
      setSidebarCollapsed(false);
      window.requestAnimationFrame(() => setSidebarContentHidden(false));
      return;
    }

    setSidebarClosing(true);
    setSidebarContentHidden(true);
    setSidebarCollapsed(true);
    sidebarCollapseTimeoutRef.current = setTimeout(() => {
      setSidebarClosing(false);
      sidebarCollapseTimeoutRef.current = null;
    }, 580);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative overflow-y-hidden overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-lg:overflow-hidden">

      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -right-1/4 w-[1000px] h-[1000px] rounded-full bg-blue-600/5 blur-[150px]" />
        <div className="absolute bottom-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-indigo-600/5 blur-[120px]" />
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-[opacity,backdrop-filter] ${sidebarPanelMotionClass} lg:hidden ${sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      {/* SIDEBAR PANEL */}
      <aside
        className={`fixed inset-y-0 left-0 bg-[#0b0d12]/95 backdrop-blur-xl border-r border-white/[0.06] pt-4 pb-6 flex flex-col z-50 overflow-visible transform-gpu will-change-[width,transform,padding,box-shadow] transition-[width,transform,padding,box-shadow] ${sidebarPanelMotionClass} lg:translate-x-0 lg:h-screen ${sidebarOpen ? 'translate-x-0 max-lg:shadow-2xl max-lg:shadow-slate-950/60' : '-translate-x-full'} ${effectiveCollapsed ? 'w-[68px] px-0' : 'w-80 px-5 max-lg:shadow-2xl max-lg:shadow-slate-950/60'}`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Logo & Brand */}
          <div className={`group/header relative flex transition-[height,margin,padding] ${sidebarPanelMotionClass} ${effectiveCollapsed ? 'items-center justify-center py-4 mb-2 h-16' : 'items-center justify-between py-3 mb-5 h-14'}`}>
            <div className={`flex min-w-0 items-center transition-[gap,opacity,transform] ${sidebarPanelMotionClass} ${effectiveCollapsed ? 'gap-0 group-hover/header:opacity-0 group-hover/header:scale-90' : 'gap-3'}`}>
              <div className="relative flex flex-shrink-0 items-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/header:scale-105 motion-reduce:transition-none">
                <img 
                  src="/logos/my-tax-logo-icon.svg" 
                  alt="My Tax Icon" 
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className={`flex flex-col overflow-hidden transition-[max-width,opacity,transform] ${sidebarItemMotionClass} ${effectiveContentHidden ? 'max-w-0 -translate-x-2 opacity-0' : 'max-w-[210px] translate-x-0 opacity-100 delay-100'}`}>
                <img 
                  src="/logos/my-tax-logo-text.svg" 
                  alt="My Tax Text" 
                  className="h-[24px] ml-1 w-auto object-contain object-left"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSidebar}
              className={`group/toggle flex h-10 w-10 items-center justify-center text-slate-400 transition-[opacity,transform,background-color,color] ${sidebarPanelMotionClass} hover:bg-white/[0.08] hover:text-white z-10 ${effectiveCollapsed ? `absolute rounded-2xl ${canHoverPointer ? 'opacity-0 scale-90 group-hover/header:opacity-100 group-hover/header:scale-100' : 'opacity-100 scale-100 bg-white/[0.055]'}` : 'relative rounded-full opacity-100 scale-100'}`}
              aria-label={effectiveCollapsed ? "Buka sidebar" : "Tutup sidebar"}
            >
              <svg className="absolute h-5 w-5 opacity-100 transition duration-200 group-hover/toggle:opacity-0 motion-reduce:transition-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" strokeWidth="2" />
                <path d="M9 3v18" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <svg className="absolute h-5 w-5 opacity-0 transition duration-200 group-hover/toggle:opacity-100 motion-reduce:transition-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" strokeWidth="2" />
                <path d="M9 3v18" strokeWidth="2" strokeLinecap="round" />
                <path d={effectiveCollapsed ? "m13 15 3-3-3-3" : "m15 15-3-3 3-3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 opacity-0 shadow-xl transition group-hover/toggle:opacity-100">
                {effectiveCollapsed ? "Buka sidebar" : "Tutup sidebar"}
              </span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className={`min-h-0 flex-1 transition-[padding] ${sidebarPanelMotionClass} [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${effectiveCollapsed ? 'space-y-2 overflow-visible' : 'space-y-2 overflow-y-auto overflow-x-hidden pr-1'}`}>
            {navItems.map((item, index) => {
              const isActive = isGroupActive(item);
              const isOpen = Boolean(openNavGroups[item.name]);
              const itemDelay = effectiveContentHidden ? '0ms' : `${140 + index * 55}ms`;

              if (item.children) {
                return (
                  <div key={item.name} className={`${effectiveCollapsed ? 'block relative' : 'space-y-1'} transition-[opacity,transform] ${sidebarItemMotionClass}`} style={{ transitionDelay: itemDelay }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (effectiveCollapsed || effectiveContentHidden) {
                          if (sidebarCollapseTimeoutRef.current) {
                            clearTimeout(sidebarCollapseTimeoutRef.current);
                            sidebarCollapseTimeoutRef.current = null;
                          }
                          setSidebarClosing(false);
                          setSidebarCollapsed(false);
                          setSidebarContentHidden(false);
                          setOpenNavGroups((current) => ({ ...current, [item.name]: true }));
                        } else {
                          setOpenNavGroups((current) => ({ ...current, [item.name]: !current[item.name] }));
                        }
                      }}
                      className={`relative flex items-center text-sm font-semibold transition-[background-color,color,box-shadow,width,padding,gap] ${sidebarPanelMotionClass} group ${effectiveCollapsed ? collapsedItemClass : 'w-full rounded-full px-4 py-3 gap-3.5'} ${isActive ? 'bg-white/[0.08] text-white shadow-lg shadow-blue-500/10' : 'text-slate-300 hover:text-white hover:bg-white/[0.055]'}`}
                      aria-expanded={isOpen}
                    >
                      <span className={`${isActive ? 'text-blue-300' : 'text-slate-300 group-hover:text-white'} flex-shrink-0 transition-colors duration-200`}>
                        {item.icon}
                      </span>

                      <span className={`overflow-hidden origin-left truncate text-left transition-[max-width,opacity,transform] ${sidebarItemMotionClass} ${effectiveContentHidden ? 'max-w-0 translate-x-1 opacity-0 pointer-events-none' : 'max-w-[150px] translate-x-0 opacity-100'}`} style={{ transitionDelay: itemDelay }}>
                        {item.name}
                      </span>

                      <span className={`${effectiveContentHidden ? 'absolute opacity-0 scale-75 pointer-events-none' : 'ml-auto opacity-100'} flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-lg font-light leading-none transition-[opacity,transform,color] ${sidebarItemMotionClass} ${isOpen ? 'text-blue-200 rotate-180' : 'text-slate-500 group-hover:text-slate-300 rotate-0'}`} style={{ transitionDelay: itemDelay }}>
                        {isOpen ? '-' : '+'}
                      </span>
                      {effectiveCollapsed && (
                        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 opacity-0 shadow-xl transition group-hover:opacity-100">
                          {item.name}
                        </span>
                      )}
                    </button>

                    <div className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen && !effectiveCollapsed ? 'grid-rows-[1fr] opacity-100 translate-y-0' : 'grid-rows-[0fr] opacity-0 -translate-y-1'}`}>
                      <div className="overflow-hidden">
                        <div className="ml-6 mt-1 space-y-1 border-l border-slate-800/80 pl-3">
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`group/sub flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 ${isChildActive ? 'bg-slate-800/80 text-white' : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-200'}`}
                              >
                                <span className={`${isChildActive ? 'text-blue-300' : 'text-slate-600 group-hover/sub:text-slate-400'} transition-colors`}>
                                  {child.icon}
                                </span>
                                <span className="truncate">{child.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href || '#'}
                  onClick={() => setSidebarOpen(false)}
                  className={`relative flex items-center text-sm font-semibold transition-[background-color,color,box-shadow,width,padding,gap] ${sidebarPanelMotionClass} group ${effectiveCollapsed ? collapsedItemClass : 'rounded-full px-4 py-3 gap-3.5'} ${isActive ? 'bg-white/[0.08] text-white shadow-lg shadow-blue-500/10' : 'text-slate-300 hover:text-white hover:bg-white/[0.055]'}`}
                  style={{ transitionDelay: itemDelay }}
                >
                  <span className={`${isActive ? 'text-blue-300' : 'text-slate-300 group-hover:text-white'} flex-shrink-0 transition-colors duration-200`}>
                    {item.icon}
                  </span>

                  <span className={`overflow-hidden origin-left truncate transition-[max-width,opacity,transform] ${sidebarItemMotionClass} ${effectiveContentHidden ? 'max-w-0 translate-x-1 opacity-0 pointer-events-none' : 'max-w-[150px] translate-x-0 opacity-100'}`} style={{ transitionDelay: itemDelay }}>
                    {item.name}
                  </span>
                  {effectiveCollapsed && (
                    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 opacity-0 shadow-xl transition group-hover:opacity-100">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

      </aside>

      {/* MAIN VIEW AREA */}
      <div
        className={`flex min-w-0 flex-col overflow-y-auto h-screen relative z-10 transform-gpu will-change-transform transition-transform ${sidebarPanelMotionClass} lg:pl-[68px] ${effectiveCollapsed ? 'lg:translate-x-0' : 'lg:translate-x-[252px]'}`}
      >

        {/* HEADER BAR */}
        <header className="sticky top-0 pt-7 pb-4 px-6 md:px-12 flex items-center justify-between z-30">
          {/* Efek Transisi Blur & Gradien Halus */}
          <div className="absolute top-0 inset-x-0 h-[160%] bg-[#020617]/50 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)] pointer-events-none z-[-1]" />

          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.055] text-slate-200 shadow-lg shadow-black/20 transition hover:bg-white/[0.1] hover:text-white focus:outline-none lg:hidden"
              aria-label="Buka sidebar"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </button>

            {isDemoMode && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-blue-900/20">
                  Demo: {persona}
                </div>
                <button
                  onClick={() => {
                    document.cookie = "demo_mode=; path=/; max-age=0";
                    useDemoStore.getState().clearDemoMode();
                    router.refresh();
                  }}
                  className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all"
                  aria-label="Keluar dari Mode Demo"
                >
                  Tutup Demo
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <StreakCounter />
            <NotificationCenter />

            {/* GLOWING PROFILE DROPDOWN */}
            <div ref={profileDropdownRef} className="relative group/profile">
              <button
                type="button"
                onClick={() => {
                  if (!canHoverPointer) {
                    setProfileDropdownOpen((current) => !current);
                  }
                }}
                className="flex items-center gap-2 p-1 px-2.5 bg-slate-900 rounded-lg hover:bg-slate-800 transition-all duration-200 outline-none cursor-pointer select-none"
                aria-label="Menu Wajib Pajak"
                aria-expanded={profileDropdownOpen}
                aria-haspopup="menu"
              >
                {/* Avatar / Initials Circle */}
                <div
                  className="w-7 h-7 rounded-md bg-blue-600/10 border border-blue-500/20 bg-cover bg-center flex items-center justify-center text-[10px] font-black text-blue-400 uppercase flex-shrink-0 overflow-hidden"
                  style={displayAvatarUrl ? { backgroundImage: `url(${displayAvatarUrl})` } : undefined}
                >
                  {!displayAvatarUrl && (displayUserName ? displayUserName.substring(0, 2) : (userEmail ? userEmail.substring(0, 2) : 'US'))}
                </div>

                {/* User Name & Email Stacked */}
                <div className="flex flex-col text-left hidden sm:flex">
                  <span className="text-[11px] font-extrabold text-white leading-tight truncate max-w-[130px]">
                    {displayUserHandle || displayUserName || 'Wajib Pajak'}
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold block truncate max-w-[130px] mt-0.5 leading-none">
                    {userEmail}
                  </span>
                </div>

                {/* Dynamic Chevron */}
                <svg className={`w-3 h-3 text-slate-400 flex-shrink-0 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''} ${canHoverPointer ? 'group-hover/profile:rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
              </button>

              <div className={`absolute right-0 top-full pt-3 w-56 transition-all duration-300 z-50 origin-top-right transform ${profileDropdownOpen ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible translate-y-2 pointer-events-none'} ${canHoverPointer ? 'group-hover/profile:opacity-100 group-hover/profile:visible group-hover/profile:translate-y-0 group-hover/profile:pointer-events-auto' : ''}`}>
                <div className="bg-slate-950/95 backdrop-blur-2xl border border-slate-800/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 space-y-3">
                  <div className="border-b border-slate-900 pb-3">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Wajib Pajak Aktif</span>
                      <span className="text-xs font-bold text-white block mt-0.5 truncate" title={displayUserName || userEmail || ''}>
                        {displayUserName || userEmail}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={(event) => event.preventDefault()}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-slate-300 rounded-lg cursor-default"
                        aria-label="Total points yang dikumpulkan"
                      >
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4zM5 6H3v2a4 4 0 004 4M19 6h2v2a4 4 0 01-4 4" />
                        </svg>
                        <span>{educationPoints.toLocaleString('id-ID')} Poin Edukasi</span>
                      </button>

                      <button
                        type="button"
                        onClick={(event) => event.preventDefault()}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-slate-300 rounded-lg cursor-default"
                        aria-label="Level edukasi pajak"
                      >
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3l1.9 3.86 4.26.62-3.08 3 .73 4.24L12 12.72l-3.81 2 .73-4.24-3.08-3 4.26-.62L12 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 21h8" />
                        </svg>
                        <span>Level {educationLevel}</span>
                      </button>

                      <Link
                        href="/dashboard/profil-saya"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-slate-350 hover:text-white hover:bg-slate-900 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        Profil Saya
                      </Link>

                      <Link
                        href="/dashboard/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-slate-350 hover:text-white hover:bg-slate-900 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.607 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Pengaturan
                      </Link>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all text-left cursor-pointer border border-transparent hover:border-red-500/10"
                      >
                        <svg className="w-4 h-4 text-red-500/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Keluar Sesi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-6 md:p-12">
          {children}
        </main>
      </div>

      <TaxAssistantChat />
      <TourGuide />
    </div>
  );
}
