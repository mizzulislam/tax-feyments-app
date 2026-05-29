'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useAlert } from '@/contexts/AlertContext';



export default function NotificationSettingsPage() {
  const { showAlert } = useAlert();
  const [isTableMissing, setIsTableMissing] = useState(false);
  const [checkingTable, setCheckingTable] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [prefs, setPrefs] = useState({
    email_notifications: true,
    push_notifications: false,
    deadline_reminder_days: 3,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00'
  });

  const checkAndLoad = async () => {
    try {
      setCheckingTable(true);
      setCheckingTable(true);
      setIsTableMissing(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        setPrefs({
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          deadline_reminder_days: data.deadline_reminder_days,
          quiet_hours_start: data.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end
        });
        
        // Update browser permission status if needed
        if (data.push_notifications && typeof window !== 'undefined' && 'Notification' in window) {
           if (Notification.permission === 'default') {
             Notification.requestPermission();
           }
        }
      }

    } catch (err) {
      console.error(err);
    } finally {
      setCheckingTable(false);
    }
  };

  useEffect(() => {
    checkAndLoad();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (prefs.push_notifications) {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            await showAlert('Peringatan', 'Izin Push Notification ditolak oleh browser.', 'warning');
            setPrefs(p => ({ ...p, push_notifications: false }));
          }
        }
      }

      const payload = {
        user_id: user.id,
        email_notifications: prefs.email_notifications,
        push_notifications: prefs.push_notifications,
        deadline_reminder_days: prefs.deadline_reminder_days,
        quiet_hours_start: prefs.quiet_hours_start,
        quiet_hours_end: prefs.quiet_hours_end,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('notification_preferences').upsert(payload, { onConflict: 'user_id' });
      
      if (error) throw error;
      setSuccessMsg('Preferensi notifikasi berhasil disimpan.');
      setTimeout(() => setSuccessMsg(null), 3000);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan preferensi notifikasi.';
      await showAlert('Gagal', message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative max-w-4xl mx-auto">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
            Pengaturan <span className="text-yellow-500 font-extrabold">Notifikasi</span>
          </h1>
          <p className="text-slate-400 max-w-xl text-sm leading-relaxed font-medium">
            Atur bagaimana sistem dan My Tax berkomunikasi dengan Anda. Kendalikan notifikasi realtime, pengingat deadline, dan jam sibuk Anda.
          </p>
        </div>
        
        <Link 
          href="/dashboard/profile" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl transition-all font-medium text-xs self-start sm:self-center shadow-lg uppercase tracking-wider"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Kembali ke Profil
        </Link>
      </header>

      {checkingTable ? (
        <div className="py-20 text-center text-slate-500 font-medium">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-yellow-500 border-t-transparent mb-4"></div>
          <p className="text-sm">Membaca Konfigurasi...</p>
        </div>
      ) : (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8">
          
          {successMsg && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400 rounded-2xl flex gap-3">
               <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
               {successMsg}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">Push Notifications (Browser)</h4>
                <p className="text-[10px] text-slate-500 mt-1">Dapatkan notifikasi realtime langsung di desktop/device Anda.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={prefs.push_notifications}
                  onChange={(e) => setPrefs(p => ({ ...p, push_notifications: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-5">
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">Email Notifications</h4>
                <p className="text-[10px] text-slate-500 mt-1">Terima rekapitulasi dan insight penting via Email.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={prefs.email_notifications}
                  onChange={(e) => setPrefs(p => ({ ...p, email_notifications: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
              </label>
            </div>

            <div className="space-y-3 border-b border-slate-800/80 pb-5">
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">Smart Deadline Reminder</h4>
                <p className="text-[10px] text-slate-500 mt-1">Berapa hari sebelum batas waktu (deadline) Anda ingin diingatkan secara agresif?</p>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={prefs.deadline_reminder_days}
                  onChange={(e) => setPrefs(p => ({ ...p, deadline_reminder_days: parseInt(e.target.value) }))}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <span className="w-16 text-center font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 text-xs">
                  {prefs.deadline_reminder_days} Hari
                </span>
              </div>
            </div>

            <div className="space-y-3 pb-2">
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">Mode Hening (Quiet Hours)</h4>
                <p className="text-[10px] text-slate-500 mt-1">Sistem tidak akan mengirimkan notifikasi push/email pada jam istirahat berikut.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mulai Jam</label>
                  <input 
                    type="time" 
                    value={prefs.quiet_hours_start}
                    onChange={(e) => setPrefs(p => ({ ...p, quiet_hours_start: e.target.value }))}
                    className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-yellow-500/50 outline-none"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sampai Jam</label>
                  <input 
                    type="time" 
                    value={prefs.quiet_hours_end}
                    onChange={(e) => setPrefs(p => ({ ...p, quiet_hours_end: e.target.value }))}
                    className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-yellow-500/50 outline-none"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-800/80 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Preferensi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
