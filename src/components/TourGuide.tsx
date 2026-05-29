'use client';

import { useState, useEffect } from 'react';
import { Joyride, Step, TooltipRenderProps, EventData } from 'react-joyride';

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
        <h3 className="font-bold text-lg text-slate-800">Selamat Datang di My Tax! 🎉</h3>
        <p className="text-sm text-slate-600">Mari kami pandu Anda untuk mengenal fitur-fitur utama agar pelaporan pajak Anda lebih mudah dan cepat.</p>
      </>
    )
  },
  {
    target: '.tax-type-chip',
    content: (
      <p className="text-sm text-slate-600">Pilih jenis pajak yang ingin Anda hitung di sini. Tersedia berbagai opsi seperti PPh 21, PPN, hingga Pajak Daerah.</p>
    ),
    placement: 'left',
  },
  {
    target: '.upload-area',
    content: (
      <p className="text-sm text-slate-600">Anda juga bisa menggunakan fitur OCR untuk mengekstrak data nominal secara otomatis dari bukti potong atau struk Anda.</p>
    ),
    placement: 'top',
  },
];

export default function TourGuide() {
  const [run, setRun] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [steps, setSteps] = useState<Step[]>(TOUR_STEPS);

  useEffect(() => {
    setIsMounted(true);
    // Cek apakah user sudah pernah menyelesaikan tour (menggunakan localStorage)
    const hasSeenTour = localStorage.getItem('myTax_tour_completed');
    
    // Memberikan sedikit delay sebelum tour berjalan agar UI sudah render sempurna
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        const availableSteps = TOUR_STEPS.filter((step) => {
          if (step.target === 'body') return true;
          return typeof step.target === 'string' && Boolean(document.querySelector(step.target));
        });
        setSteps(availableSteps);
        setRun(availableSteps.length > 0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;

    if (status === 'finished' || status === 'skipped') {
      setRun(false);
      localStorage.setItem('myTax_tour_completed', 'true');
    }
  };

  if (!isMounted) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
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
