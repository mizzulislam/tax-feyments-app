# **🤖 Rekayasa Perangkat Lunak "What-If" Optimizer**

## **Tingkat Keparahan: Fungsionalitas Rendah (Tingkat Kegunaan Bisnis Lemah)**

### **🚨 Mengapa Simulator Perlu Direkayasa Ulang?**

Halaman "What-If" Simulator yang dirancang saat ini hanya menyajikan input slider statis untuk mengubah jumlah gaji kotor, lalu menampilkan perubahan angka dalam rupiah tanpa penjelasan logis.

Di dunia nyata:

1. Pengguna awam tidak memahami arti selisih angka tersebut bagi masa depan pajak mereka.  
2. Aplikasi tidak memberikan strategi legal (Tax Planning) untuk menyelamatkan pendapatan kotor mereka agar tidak terkena bracket tarif progresif yang tinggi.

Kita harus mengupgrade komponen pembanding agar bertindak sebagai **Smart Tax Optimization Advisor**.

### **🛠️ Solusi Arsitektural & Perbaikan Logika**

Kami merekomendasikan pembuatan komponen analisis taktis interaktif yang mengevaluasi skenario masukan secara real-time dan menghasilkan rekomendasi proaktif yang berlandaskan hukum perpajakan DJP.

Ganti/perbarui visualisasi perbandingan pada file **src/components/whatif/ScenarioComparisonCard.tsx** menggunakan kode komponen pintar berikut:

import React from 'react';

interface SimulatorVariables {  
  hasPekerjaanBebas: boolean;  
  hasUsahaUMKM: boolean;  
  omzetUsahaTahunan: number;  
  totalPenghasilanBruto: number;  
}

interface TaxOptimizationAdvisorProps {  
  baseTaxDue: number; // PPh terutang dari skenario riil saat ini  
  simulatedTaxDue: number; // PPh terutang dari hasil geser slider simulasi  
  variables: SimulatorVariables;  
}

export const TaxOptimizationAdvisor: React.FC\<TaxOptimizationAdvisorProps\> \= ({  
  baseTaxDue,  
  simulatedTaxDue,  
  variables  
}) \=\> {  
  const taxSavings \= baseTaxDue \- simulatedTaxDue;

  // Mesin rekomendasi aturan taktis perpajakan  
  const evaluateOptimizationStrategy \= () \=\> {  
    // Skenario Konflik Pekerjaan Bebas vs PP 23  
    if (variables.hasPekerjaanBebas && variables.hasUsahaUMKM) {  
      return {  
        badge: 'Kombinasi Berisiko Tinggi',  
        color: 'border-amber-200 bg-amber-50 text-amber-800',  
        strategy: 'Inisiasi Pendirian Badan Hukum Terpisah (Spin-Off)',  
        description: 'Secara legal (UU HPP), Anda dilarang menggunakan tarif PPh Final UMKM 0.5% karena memiliki penghasilan Pekerjaan Bebas. Solusi terbaik agar usaha dagang Anda tetap berhak atas PPh Final 0.5% adalah memisahkan unit usaha tersebut ke dalam badan hukum tersendiri (Firma/CV), sehingga tidak tercampur dengan SPT pribadi Anda.'  
      };  
    }

    // Skenario Menembus Batas Kewajiban Pembukuan (Rp 4.8 Miliar)  
    if (variables.omzetUsahaTahunan \> 4800000000\) {  
      return {  
        badge: 'Kewajiban Pembukuan Mutlak',  
        color: 'border-red-200 bg-red-50 text-red-800',  
        strategy: 'Wajib Menyelenggarakan Pembukuan & Daftar PKP',  
        description: 'Omzet simulasi Anda menembus batas maksimal penggunaan Norma (NPPN) yaitu Rp 4.8 Miliar setahun. Anda wajib menyelenggarakan pembukuan penuh sesuai standar akuntansi keuangan dan segera mengajukan pengukuhan Pengusaha Kena Pajak (PKP) untuk memungut PPN.'  
      };  
    }

    // Skenario Efisiensi Pengurang Zakat/Donasi Keagamaan  
    if (variables.totalPenghasilanBruto \> 250000000 && taxSavings \> 0\) {  
      return {  
        badge: 'Strategi Pengurang Legal',  
        color: 'border-emerald-200 bg-emerald-50 text-emerald-800',  
        strategy: 'Salurkan Zakat/Sumbangan Keagamaan Lewat Lembaga Resmi',  
        description: 'Anda dapat mengurangi PPh terutang secara legal hingga 5% dari penghasilan bruto dengan menyalurkan zakat atau sumbangan keagamaan wajib melalui badan/lembaga amil zakat resmi yang disahkan oleh Pemerintah (seperti BAZNAS).'  
      };  
    }

    // Default aman  
    return {  
      badge: 'Skenario Efisien',  
      color: 'border-blue-200 bg-blue-50 text-blue-800',  
      strategy: 'Optimalkan Pengumpulan Bukti Potong Pihak Ketiga',  
      description: 'Pastikan Anda menyimpan seluruh dokumen bukti potong (Formulir 1721-A1 atau Bukti Potong PPh Pasal 23/21 Tidak Final) sepanjang tahun berjalan. Kredit pajak ini akan langsung mengurangi jumlah kekurangan bayar pajak Anda di akhir tahun secara signifikan.'  
    };  
  };

  const advice \= evaluateOptimizationStrategy();

  return (  
    \<div className={\`p-5 rounded-2xl border ${advice.color} shadow-sm backdrop-blur-md transition-all duration-300\`}\>  
      \<div className="flex justify-between items-center mb-3"\>  
        \<h4 className="text-sm font-bold tracking-wide uppercase"\>Rekomendasi Penasihat Pintar\</h4\>  
        \<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/80 shadow-sm border border-current/10"\>  
          {advice.badge}  
        \</span\>  
      \</div\>

      \<div className="space-y-2"\>  
        \<h5 className="text-base font-extrabold leading-snug"\>{advice.strategy}\</h5\>  
        \<p className="text-xs leading-relaxed opacity-90"\>{advice.description}\</p\>  
      \</div\>

      {taxSavings \> 0 ? (  
        \<div className="mt-4 p-3 rounded-xl bg-white/70 border border-current/5 flex justify-between items-center"\>  
          \<span className="text-xs text-slate-500 font-medium"\>Estimasi Dana yang Dapat Dihemat:\</span\>  
          \<span className="text-base font-black text-emerald-600"\>  
            Rp {taxSavings.toLocaleString('id-ID')}  
          \</span\>  
        \</div\>  
      ) : taxSavings \< 0 ? (  
        \<div className="mt-4 p-3 rounded-xl bg-white/70 border border-current/5 flex justify-between items-center"\>  
          \<span className="text-xs text-slate-500 font-medium font-sans"\>Tambahan Beban Pajak Skenario:\</span\>  
          \<span className="text-base font-black text-red-600"\>  
            Rp {Math.abs(taxSavings).toLocaleString('id-ID')}  
          \</span\>  
        \</div\>  
      ) : null}

      \<div className="mt-4 flex gap-2"\>  
        \<button className="flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all bg-white hover:bg-white/90 border border-current/20 shadow-sm"\>  
          Simpan Skenario  
        \</button\>  
        \<button className="flex-1 text-center py-2 rounded-lg text-xs font-bold text-white transition-all bg-slate-900 hover:bg-slate-800 shadow-sm"\>  
          Tanya AI Taxologist  
        \</button\>  
      \</div\>  
    \</div\>  
  );  
};

### **✅ Langkah Sinkronisasi & Tindakan Lanjutan:**

* \[ \] Pasang komponen TaxOptimizationAdvisor di sebelah kanan kalkulator simulasi pada halaman src/app/dashboard/what-if/page.tsx.  
* \[ \] Hubungkan event klik tombol *"Tanya AI Taxologist"* untuk membuka floating assistant widget secara otomatis dengan menginjeksikan context skenario simulasi aktif ke prompt state Gemini API agar AI dapat memberikan panduan langkah per langkah terkait strategi tersebut.