'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  useFetchNotifications, 
  useMarkAsRead,
} from '@/hooks/useNotifications';

export default function NotificationCenter() {
  const { data: notifications = [], isLoading } = useFetchNotifications();
  const markAsRead = useMarkAsRead();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [canHoverPointer, setCanHoverPointer] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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

  // RUNTIME REMINDER TAX Deadline & Profile Completion Checker (FR-14)
  useEffect(() => {
    // Import dynamically to avoid SSR issues
    const initReminders = async () => {
      const { runAutomaticReminders } = await import('@/lib/reminderEngine');
      runAutomaticReminders();
    };

    // Jalankan pengingat otomatis saat component di-mount
    const timeout = setTimeout(() => {
      initReminders();
    }, 3000); // Tunggu 3 detik setelah memuat agar transisi halaman mulus

    return () => clearTimeout(timeout);
  }, []);

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    unread.forEach((n) => {
      markAsRead.mutate(n.id);
    });
  };

  return (
    <div ref={popoverRef} className="relative z-40 group/notif">
      {/* BELL BELL BELL ICON WITH UNREAD BADGE */}
      <button
        type="button"
        onClick={() => {
          if (!canHoverPointer) {
            setPopoverOpen((current) => !current);
          }
        }}
        className="relative p-2 bg-slate-900 border border-slate-800/40 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all duration-200 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 flex items-center justify-center shadow-lg cursor-pointer"
        aria-label="Notifikasi Perpajakan"
        aria-expanded={popoverOpen}
        aria-haspopup="menu"
      >
        <svg className={`w-4 h-4 ${unreadCount > 0 ? 'animate-[swing_1.5s_ease-in-out_infinite] text-yellow-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.02 6.02 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 flex items-center justify-center bg-red-500 text-[9px] font-black text-white rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-slate-950 animate-pulse font-mono">
            {unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN GLASSMORPHIC POPOVER LIST */}
      <div className={`absolute right-0 top-full pt-3 w-72 sm:w-80 transition-all duration-300 z-50 origin-top-right transform ${popoverOpen ? 'opacity-100 visible translate-y-0 pointer-events-auto' : 'opacity-0 invisible translate-y-2 pointer-events-none'} ${canHoverPointer ? 'group-hover/notif:opacity-100 group-hover/notif:visible group-hover/notif:translate-y-0 group-hover/notif:pointer-events-auto' : ''}`}>
        <div className="bg-slate-950/95 backdrop-blur-2xl border border-slate-800/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/40">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Notifikasi Sistem</h4>
                <p className="text-[10px] text-slate-500 font-medium">Pengingat & pembaruan status pajak Anda</p>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-extrabold text-blue-400 hover:text-blue-300 uppercase tracking-wider transition-colors focus:outline-none"
                >
                  Tandai Semua Dibaca
                </button>
              )}
            </div>

            {/* Notifications Body */}
            <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-900/60 custom-scrollbar">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border border-blue-500 border-t-transparent"></div>
                  Memuat notifikasi...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-3 border border-slate-800/50">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
                    </svg>
                  </div>
                  <h5 className="text-xs font-bold text-slate-400 mb-1">Semua Bersih</h5>
                  <p className="text-[10px] text-slate-500 max-w-[200px]">Belum ada notifikasi baru untuk Anda saat ini.</p>
                </div>
              ) : (
                notifications.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-4.5 transition-all relative flex gap-3 hover:bg-slate-900/30 ${!item.is_read ? 'bg-blue-500/5 border-l-2 border-blue-500' : ''}`}
                  >
                    {/* Glowing blue dot if unread */}
                    {!item.is_read && (
                      <span className="absolute top-4.5 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    )}

                    {/* Icon Category Indicator */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      item.priority === 'urgent' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                      item.notification_type === 'ai_insight' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                      item.notification_type === 'deadline' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                      item.notification_type === 'achievement' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      !item.is_read ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-900 border-slate-800/40 text-slate-500'
                    }`}>
                      {item.notification_type === 'ai_insight' ? (
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      ) : item.notification_type === 'deadline' || item.priority === 'urgent' ? (
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      ) : item.notification_type === 'document' ? (
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      ) : (
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.02 6.02 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      )}
                    </div>

                    <div className="space-y-1 pr-4">
                      <p className={`text-xs font-bold leading-tight ${!item.is_read ? 'text-white' : 'text-slate-300'}`}>
                        {item.title}
                        {item.priority === 'urgent' && <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] bg-rose-500/20 text-rose-400 uppercase tracking-widest border border-rose-500/30">Urgent</span>}
                      </p>
                      
                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-[9px] text-slate-500 font-semibold font-mono">
                          {new Date(item.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        
                        {!item.is_read && (
                          <button
                            onClick={() => markAsRead.mutate(item.id)}
                            className="text-[9px] text-blue-400 hover:text-blue-300 font-extrabold uppercase tracking-wider"
                          >
                            Tandai Dibaca
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
