'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type AlertType = 'info' | 'success' | 'error' | 'warning';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
  isConfirm: boolean;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface AlertContextType {
  showAlert: (title: string, message: string, type?: AlertType) => Promise<void>;
  showConfirm: (title: string, message: string, confirmText?: string, cancelText?: string, type?: AlertType) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    isConfirm: false,
    confirmText: 'OK',
    cancelText: 'Batal',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showAlert = useCallback((title: string, message: string, type: AlertType = 'info') => {
    return new Promise<void>((resolve) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type,
        isConfirm: false,
        confirmText: 'OK',
        cancelText: '',
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, isOpen: false }));
          resolve();
        },
        onCancel: () => {
          setAlertState(prev => ({ ...prev, isOpen: false }));
          resolve();
        },
      });
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string, confirmText: string = 'Ya', cancelText: string = 'Batal', type: AlertType = 'warning') => {
    return new Promise<boolean>((resolve) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type,
        isConfirm: true,
        confirmText,
        cancelText,
        onConfirm: () => {
          setAlertState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setAlertState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  useEffect(() => {
    if (!alertState.isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        alertState.onCancel();
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [alertState]);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {mounted && alertState.isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="global-alert-dialog-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              if (alertState.isConfirm) {
                alertState.onCancel();
              } else {
                alertState.onConfirm();
              }
            }
          }}
        >
          <div className="relative w-full max-w-sm overflow-visible rounded-3xl p-[1px] shadow-2xl shadow-black/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
            <div className={`pointer-events-none absolute -inset-[2px] rounded-3xl opacity-80 blur-md ${
              alertState.type === 'error' ? 'bg-[linear-gradient(135deg,rgba(244,63,94,0.58),rgba(225,29,72,0.18)_40%,rgba(159,18,57,0.28)_68%,rgba(15,23,42,0.1))]' :
              alertState.type === 'success' ? 'bg-[linear-gradient(135deg,rgba(16,185,129,0.58),rgba(5,150,105,0.18)_40%,rgba(6,78,59,0.28)_68%,rgba(15,23,42,0.1))]' :
              alertState.type === 'warning' ? 'bg-[linear-gradient(135deg,rgba(245,158,11,0.58),rgba(217,119,6,0.18)_40%,rgba(146,64,14,0.28)_68%,rgba(15,23,42,0.1))]' :
              'bg-[linear-gradient(135deg,rgba(59,130,246,0.58),rgba(14,165,233,0.18)_40%,rgba(99,102,241,0.28)_68%,rgba(15,23,42,0.1))]'
            }`}></div>
            <div className={`pointer-events-none absolute inset-0 rounded-3xl ${
              alertState.type === 'error' ? 'bg-[linear-gradient(135deg,rgba(244,63,94,0.74),rgba(159,18,57,0.2)_45%,rgba(148,163,184,0.1)_75%,rgba(15,23,42,0.38))]' :
              alertState.type === 'success' ? 'bg-[linear-gradient(135deg,rgba(16,185,129,0.74),rgba(6,78,59,0.2)_45%,rgba(148,163,184,0.1)_75%,rgba(15,23,42,0.38))]' :
              alertState.type === 'warning' ? 'bg-[linear-gradient(135deg,rgba(245,158,11,0.74),rgba(146,64,14,0.2)_45%,rgba(148,163,184,0.1)_75%,rgba(15,23,42,0.38))]' :
              'bg-[linear-gradient(135deg,rgba(59,130,246,0.74),rgba(30,64,175,0.2)_45%,rgba(148,163,184,0.1)_75%,rgba(15,23,42,0.38))]'
            }`}></div>
            <div className="relative rounded-[23px] bg-slate-950/95 p-5 shadow-[inset_0_1px_0_rgba(148,163,184,0.1)] backdrop-blur-2xl">
              <div className="flex items-start gap-4">
                <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                  alertState.type === 'error' ? 'border-rose-400/30 bg-rose-500/10 text-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.25)]' :
                  alertState.type === 'success' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.25)]' :
                  alertState.type === 'warning' ? 'border-amber-400/30 bg-amber-500/10 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.25)]' :
                  'border-blue-400/30 bg-blue-500/10 text-blue-300 shadow-[0_0_24px_rgba(59,130,246,0.25)]'
                }`}>
                  <div className={`absolute inset-2 rounded-full blur-md ${
                    alertState.type === 'error' ? 'bg-rose-400/20' :
                    alertState.type === 'success' ? 'bg-emerald-400/20' :
                    alertState.type === 'warning' ? 'bg-amber-400/20' :
                    'bg-blue-400/20'
                  }`}></div>
                  
                  {alertState.type === 'error' && (
                    <svg className="relative h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  )}
                  {alertState.type === 'success' && (
                    <svg className="relative h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M5 13l4 4L19 7"></path></svg>
                  )}
                  {alertState.type === 'warning' && (
                    <svg className="relative h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  )}
                  {alertState.type === 'info' && (
                    <svg className="relative h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <h3 id="global-alert-dialog-title" className="text-lg font-black tracking-tight text-white">
                    {alertState.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-slate-400">
                    {alertState.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {alertState.isConfirm && (
                  <button
                    type="button"
                    onClick={alertState.onCancel}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/40"
                  >
                    {alertState.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={alertState.onConfirm}
                  className={`rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all focus:outline-none focus:ring-2 ${
                    alertState.type === 'error' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/30 focus:ring-rose-400/40' :
                    alertState.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/30 focus:ring-emerald-400/40' :
                    alertState.type === 'warning' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/30 focus:ring-amber-400/40' :
                    'bg-blue-600 hover:bg-blue-500 shadow-blue-950/30 focus:ring-blue-400/40'
                  }`}
                >
                  {alertState.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </AlertContext.Provider>
  );
}
