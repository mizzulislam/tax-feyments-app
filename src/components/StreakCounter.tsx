'use client';

import { useEffect, useRef, useState } from 'react';
import { useGamification, useUpdateStreak } from '@/hooks/useGamification';

export default function StreakCounter() {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [canHoverPointer, setCanHoverPointer] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  const { data: gamification } = useGamification();
  const updateStreak = useUpdateStreak();

  const currentStreak = gamification?.current_streak || 0;
  const longestStreak = gamification?.max_streak || 0;

  // Render days array based on today
  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (4 - i));
    const isToday = i === 4;
    return { name: dayNames[d.getDay()], active: isToday && currentStreak > 0 };
  });

  useEffect(() => {
    // Attempt check-in once when the component mounts
    if (updateStreak.isIdle) {
      updateStreak.mutate();
    }
  }, [updateStreak]);

  useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updatePointerMode = () => setCanHoverPointer(hoverQuery.matches);

    updatePointerMode();
    hoverQuery.addEventListener('change', updatePointerMode);

    return () => hoverQuery.removeEventListener('change', updatePointerMode);
  }, []);

  useEffect(() => {
    if (!popoverOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [popoverOpen]);

  return (
    <div ref={popoverRef} className="relative group/streak">
      <button
        type="button"
        onClick={() => {
          if (!canHoverPointer) {
            setPopoverOpen((current) => !current);
          }
        }}
        className="flex items-center gap-2 h-9 px-2.5 bg-slate-900 rounded-lg hover:bg-slate-800 transition-all duration-200 outline-none cursor-pointer"
        aria-label="Streak Counter"
        aria-expanded={popoverOpen}
        aria-haspopup="menu"
      >
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20 text-orange-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        </div>
        <span className="text-xs font-bold text-white">{currentStreak}</span>
      </button>

      <div className={`absolute right-0 top-full pt-3 w-60 transition-all duration-300 z-50 origin-top-right transform ${popoverOpen ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible translate-y-2 pointer-events-none'} ${canHoverPointer ? 'group-hover/streak:opacity-100 group-hover/streak:visible group-hover/streak:translate-y-0 group-hover/streak:pointer-events-auto' : ''}`}>
        <div className="bg-slate-950/95 backdrop-blur-2xl border border-slate-800/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-3">
          <div className="flex justify-between items-center mb-4">
            {days.map((day, index) => (
              <div key={index} className="flex flex-col items-center gap-1.5">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${day.active ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-110' : 'bg-slate-800 text-slate-500'}`}>
                  <svg className="w-[16px] h-[16px]" fill={day.active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    {day.active && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />}
                  </svg>
                </div>
                <span className={`text-[10px] font-bold ${day.active ? 'text-white' : 'text-slate-500'}`}>
                  {day.name}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800/80 pt-3 flex justify-center items-center">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <span className="text-base">🔥</span>
              <span>Streak Terlama</span>
              <span className="font-bold text-white text-sm">{longestStreak}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
