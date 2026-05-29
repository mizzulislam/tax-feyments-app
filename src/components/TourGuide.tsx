'use client';

import { useState, useEffect } from 'react';
import { Joyride, Step, TooltipRenderProps, EventData, ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useRouter, usePathname } from 'next/navigation';

function CustomTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps) {
  return (
    <div {...tooltipProps} style={{ border: 'none', outline: 'none' }} className="bg-white rounded-2xl p-5 w-80 max-w-sm shadow-2xl border-none outline-none">
      <div className="space-y-2">
        {step.content}
      </div>
      <div className="flex items-center justify-between mt-6">
        <div>
          {index > 0 && (
            <button {...backProps} style={{ border: 'none', outline: 'none' }} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors border-none outline-none bg-transparent">
              Kembali
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isLastStep && (
            <button {...closeProps} style={{ border: 'none', outline: 'none' }} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors border-none outline-none bg-transparent">
              Lewati
            </button>
          )}
          <button {...primaryProps} style={{ border: 'none', outline: 'none' }} className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg transition-colors shadow-md shadow-blue-500/20 border-none outline-none ring-0">
            {isLastStep ? 'Selesai' : 'Lanjut'}
          </button>
        </div>
      </div>
    </div>
  );
}

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: (
      <>
        <h3 className="font-bold text-lg text-slate-800">Selamat Datang di Dasbor My Tax! 🎉</h3>
        <p className="text-sm text-slate-600">Mari kami pandu Anda untuk mengenal fitur-fitur utama agar pelaporan pajak Anda lebih mudah dan cepat.</p>
      </>
    )
  },
  {
    target: '.tour-target-readiness',
    content: (
      <p className="text-sm text-slate-600">Ini adalah <strong>Panel Kesiapan Pajak</strong>. Di sini Anda bisa memantau skor kelengkapan dokumen Anda secara real-time. Capai 100% agar siap lapor ke DJP!</p>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    placement: 'center',
    content: (
      <>
        <h3 className="font-bold text-lg text-slate-800">Simulasi Pajak</h3>
        <p className="text-sm text-slate-600">Selanjutnya kita akan melihat halaman Kalkulator Pajak pintar yang sudah disesuaikan dengan UU HPP terbaru.</p>
      </>
    ),
  },
  {
    target: '.tax-type-chip',
    content: (
      <p className="text-sm text-slate-600">Pilih jenis pajak yang ingin disimulasikan di sini. Semua perhitungan otomatis dan akurat!</p>
    ),
    placement: 'bottom',
  },
  {
    target: '.tour-target-assistant',
    content: (
      <p className="text-sm text-slate-600">Terakhir, jika Anda punya pertanyaan spesifik seputar pajak, klik tombol <strong>AI Assistant</strong> ini untuk berkonsultasi kapan saja. Selamat mencoba!</p>
    ),
    placement: 'left',
  },
];

export default function TourGuide() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [steps] = useState<Step[]>(TOUR_STEPS);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    const hasSeenTour = localStorage.getItem('myTax_tour_completed');
    
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: EventData) => {
    const { action, index, status, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      localStorage.setItem('myTax_tour_completed', 'true');
      window.dispatchEvent(new Event('tour_completed'));
      
      // Jika tur selesai tapi kita di halaman kalkulator (atau halaman lain yang bukan dasbor utama), kembalikan ke dasbor utama jika perlu.
      // Namun biasanya biarkan saja pengguna di halaman terakhir tur.
      if (pathname !== '/dashboard') {
         router.push('/dashboard');
      }
    } else if (([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type)) {
      // Logic routing untuk transisi antar halaman
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      // Jika lanjut dari step 1 (Kesiapan) ke step 2 (Kalkulator intro)
      if (index === 1 && action === ACTIONS.NEXT) {
        router.push('/dashboard/kalkulator');
        // Beri sedikit jeda agar animasi pindah halaman selesai sebelum step berikutnya muncul
        setTimeout(() => setStepIndex(nextStepIndex), 500);
      } 
      // Jika mundur dari step 2 (Kalkulator intro) ke step 1 (Kesiapan)
      else if (index === 2 && action === ACTIONS.PREV) {
        router.push('/dashboard');
        setTimeout(() => setStepIndex(nextStepIndex), 500);
      }
      else {
        // Update index normally
        setStepIndex(nextStepIndex);
      }
    }
  };

  if (!isMounted) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      onEvent={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      options={{
        overlayColor: 'rgba(15, 23, 42, 0.75)', // slate-900 with opacity
        zIndex: 1000,
        arrowColor: '#ffffff',
      }}
    />
  );
}
