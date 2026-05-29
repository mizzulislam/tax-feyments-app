'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDemoStore, PersonaType } from '@/store/useDemoStore';

const personas: { id: PersonaType; title: string; desc: string; icon: string }[] = [
  { id: 'Karyawan', title: 'Karyawan', desc: 'Menerima gaji dari satu atau lebih perusahaan.', icon: '🏢' },
  { id: 'Freelancer', title: 'Freelancer', desc: 'Pekerja lepas atau memiliki keahlian khusus.', icon: '💻' },
  { id: 'UMKM', title: 'UMKM', desc: 'Pemilik usaha kecil dan menengah (PP 55).', icon: '🏪' },
  { id: 'Karyawan + Freelancer', title: 'Karyawan + Freelancer', desc: 'Memiliki penghasilan gaji dan freelance.', icon: '💰' },
  { id: 'Belajar Pajak', title: 'Belajar Pajak', desc: 'Hanya ingin simulasi dan belajar lapor pajak.', icon: '🎓' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<PersonaType>(null);
  const { loadDemoData } = useDemoStore();

  const handleStartDemo = () => {
    if (!selected) return;
    loadDemoData(selected);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col justify-center items-center p-6 selection:bg-blue-500/30">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
            Pilih Profil Anda
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Bantu kami menyesuaikan checklist, rekomendasi, dan simulasi pajak sesuai dengan sumber penghasilan utama Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`p-6 rounded-3xl border-2 text-left transition-all duration-300 ${
                selected === p.id
                  ? 'bg-blue-600/10 border-blue-500 shadow-xl shadow-blue-900/20 transform -translate-y-1'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'
              }`}
            >
              <div className="text-4xl mb-4">{p.icon}</div>
              <h3 className={`text-xl font-bold mb-2 ${selected === p.id ? 'text-blue-400' : 'text-white'}`}>
                {p.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleStartDemo}
            disabled={!selected}
            className={`px-8 py-4 rounded-2xl text-lg font-black transition-all ${
              selected
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/30 transform hover:-translate-y-1'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Gunakan Demo Data
          </button>
          
          <button
            disabled={!selected}
            className={`px-8 py-4 rounded-2xl text-lg font-bold transition-all border ${
              selected
                ? 'bg-slate-900 border-slate-700 hover:border-slate-500 text-white'
                : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            Mulai dari Nol (Real)
          </button>
        </div>
      </div>
    </div>
  );
}
