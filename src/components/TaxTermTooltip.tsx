import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const TAX_GLOSSARY: Record<string, { title: string; definition: string; example?: string }> = {
  PTKP: {
    title: 'Penghasilan Tidak Kena Pajak (PTKP)',
    definition: 'Batas penghasilan yang dibebaskan dari pengenaan Pajak Penghasilan (PPh). Jika penghasilan Anda di bawah PTKP, maka Anda tidak perlu membayar PPh 21.',
    example: 'Contoh: Pekerja lajang tanpa tanggungan memiliki PTKP Rp54.000.000 per tahun.',
  },
  DPP: {
    title: 'Dasar Pengenaan Pajak (DPP)',
    definition: 'Nilai uang yang dijadikan dasar untuk menghitung pajak terutang.',
    example: 'Contoh: Jika PPN 11% dari harga barang Rp100.000, maka DPP-nya adalah Rp100.000.',
  },
  PKP: {
    title: 'Penghasilan Kena Pajak (PKP)',
    definition: 'Penghasilan wajib pajak yang menjadi dasar penghitungan Pajak Penghasilan dalam satu tahun pajak.',
    example: 'PKP = Penghasilan Neto - PTKP.',
  },
  TER: {
    title: 'Tarif Efektif Rata-Rata (TER)',
    definition: 'Skema pemotongan PPh 21 bulanan terbaru yang diberlakukan sejak 2024, didasarkan pada status PTKP dan rentang penghasilan bruto.',
  },
  'Gross Up': {
    title: 'Tunjangan Pajak (Gross Up)',
    definition: 'Metode dimana perusahaan memberikan tunjangan pajak sebesar pajak yang dipotong, sehingga penghasilan bersih (Take Home Pay) pegawai tidak berkurang.',
  }
};

interface TaxTermTooltipProps {
  term: string;
  termKey?: string;
  children?: React.ReactNode;
}

export default function TaxTermTooltip({ term, termKey, children }: TaxTermTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLSpanElement>(null);

  const lookupKey = termKey || term;
  const glossaryData = TAX_GLOSSARY[lookupKey] || {
    title: lookupKey,
    definition: 'Penjelasan istilah ini belum tersedia di glosarium.',
  };

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top - 8, // 8px spacing
      });
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <>
      <span
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex items-center gap-1 cursor-help group"
      >
        <span className="border-b border-dashed border-slate-500 hover:border-blue-400 transition-colors text-blue-400 font-semibold group-hover:text-blue-300">
          {children || term}
        </span>
      </span>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[100] pointer-events-none"
          style={{
            left: coords.x,
            top: coords.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-slate-900 border border-slate-700 shadow-xl rounded-xl p-3 max-w-xs animate-in zoom-in-95 fade-in duration-200">
            <p className="text-xs font-bold text-white mb-1.5">{glossaryData.title}</p>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-1.5">
              {glossaryData.definition}
            </p>
            {glossaryData.example && (
              <p className="text-[10px] text-blue-300/90 italic bg-blue-500/10 p-1.5 rounded">
                {glossaryData.example}
              </p>
            )}
            {/* Arrow */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
